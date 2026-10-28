import { Router, json } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { InitializePaymentDto } from '../application/dto/payment/InitializePaymentDto.js';
import { CreateManualPaymentDto } from '../application/dto/payment/CreateManualPaymentDto.js';
import { ApprovePaymentDto } from '../application/dto/payment/ApprovePaymentDto.js';
import { uploadPaymentReceipt } from '../middleware/upload.js';
import { verifyChapaWebhookSignature } from '../middleware/webhookSignature.js';

const router = Router();

/**
 * JSON body parser that captures the raw body buffer for webhook signature
 * verification. Applied only to webhook routes so it does not affect other
 * routes that rely on the global body parser.
 */
const jsonWithRawBody = json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
});

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize a payment
 *     description: Initialize a new payment through a payment gateway (Chapa, Telebirr, or SantimPay)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitializePaymentDto'
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment initialized
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl:
 *                       type: string
 *                       description: URL to redirect user for payment
 *                     txRef:
 *                       type: string
 *                       description: Transaction reference
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/initialize',
  authenticate,
  ValidationMiddleware.validate(InitializePaymentDto),
  paymentController.initializePayment
);

/**
 * @swagger
 * /payments/verify/{txRef}:
 *   get:
 *     summary: Verify a payment
 *     description: Verify the status of a payment by transaction reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */
router.get('/verify/:txRef', authenticate, paymentController.verifyPayment);

/**
 * @swagger
 * /payments/gateways:
 *   get:
 *     summary: Get available payment gateways
 *     description: Retrieve list of available payment gateways and the default gateway
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment gateways retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     gateways:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [chapa, telebirr, santimpay]
 *                           name:
 *                             type: string
 *                           isConfigured:
 *                             type: boolean
 *                     default:
 *                       type: string
 *                       example: chapa
 */
router.get('/gateways', paymentController.getAvailableGateways);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Payment webhook (legacy)
 *     description: Legacy webhook endpoint for Chapa payment notifications
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', jsonWithRawBody, verifyChapaWebhookSignature, paymentController.handleWebhook);

/**
 * @swagger
 * /payments/webhook/chapa:
 *   post:
 *     summary: Chapa webhook
 *     description: Webhook endpoint for Chapa payment notifications
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook/chapa', jsonWithRawBody, verifyChapaWebhookSignature, paymentController.handleChapaWebhook);

/**
 * @swagger
 * /payments/webhook/telebirr:
 *   post:
 *     summary: Telebirr webhook
 *     description: Webhook endpoint for Telebirr payment notifications
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: x-telebirr-signature
 *         schema:
 *           type: string
 *         description: Telebirr signature for webhook verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook/telebirr', paymentController.handleTelebirrWebhook);

/**
 * @swagger
 * /payments/webhook/santimpay:
 *   post:
 *     summary: SantimPay webhook
 *     description: Webhook endpoint for SantimPay payment notifications
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: x-santimpay-signature
 *         schema:
 *           type: string
 *         description: SantimPay signature for webhook verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook/santimpay', paymentController.handleSantimPayWebhook);

/**
 * @swagger
 * /payments/pending-approval:
 *   get:
 *     summary: Get pending approval payments
 *     description: Retrieve payments awaiting approval (bank transfers). Owner only.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Pending payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.get(
  '/pending-approval',
  authenticate,
  authorize('owner', 'admin'),
  paymentController.getPendingApprovalPayments
);

/**
 * @swagger
 * /payments/calendar:
 *   get:
 *     summary: Get payment calendar
 *     description: Retrieve payment schedule/calendar for a specific month
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (defaults to current year)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (defaults to current month)
 *     responses:
 *       200:
 *         description: Payment calendar retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       payments:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 */
router.get('/calendar', authenticate, paymentController.getPaymentCalendar);

/**
 * @swagger
 * /payments/reminders:
 *   get:
 *     summary: Get payment reminders
 *     description: Retrieve upcoming and overdue payment reminders
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment reminders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     upcoming:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     overdue:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 */
router.get('/reminders', authenticate, paymentController.getPaymentReminders);

/**
 * @swagger
 * /payments/stats/summary:
 *   get:
 *     summary: Get payment statistics
 *     description: Retrieve payment statistics summary. Owner only.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for statistics (defaults to current year)
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCollected:
 *                       type: number
 *                     totalPending:
 *                       type: number
 *                     totalOverdue:
 *                       type: number
 *                     collectionRate:
 *                       type: number
 *                     monthlyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           collected:
 *                             type: number
 *                           pending:
 *                             type: number
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.get(
  '/stats/summary',
  authenticate,
  authorize('owner', 'admin'),
  paymentController.getPaymentStats
);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve payments based on user role. Owners see all their tenants' payments, tenants see their own payments.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, deposit, maintenance, utility, penalty]
 *         description: Filter by payment type
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID (owner only)
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, paymentController.getPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a single payment
 *     description: Retrieve details of a specific payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticate, paymentController.getPayment);

/**
 * @swagger
 * /payments/bank-transfer:
 *   post:
 *     summary: Submit bank transfer payment
 *     description: Submit a bank transfer payment with receipt for approval
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - amount
 *               - type
 *               - month
 *               - year
 *               - receipt
 *             properties:
 *               tenantId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [rent, deposit, maintenance, utility, penalty]
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               year:
 *                 type: integer
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Receipt image file
 *     responses:
 *       201:
 *         description: Bank transfer submitted for approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bank transfer submitted for approval
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Receipt image is required
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/bank-transfer',
  authenticate,
  uploadPaymentReceipt.single('receipt'),
  paymentController.submitBankTransfer
);

/**
 * @swagger
 * /payments/{id}/approve:
 *   patch:
 *     summary: Approve a payment
 *     description: Approve a bank transfer payment. Owner only.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApprovePaymentDto'
 *     responses:
 *       200:
 *         description: Payment approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment approved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 *       404:
 *         description: Payment not found
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(ApprovePaymentDto),
  paymentController.approvePayment
);

/**
 * @swagger
 * /payments/{id}/reject:
 *   patch:
 *     summary: Reject a payment
 *     description: Reject a bank transfer payment. Owner only.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApprovePaymentDto'
 *     responses:
 *       200:
 *         description: Payment rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment rejected
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 *       404:
 *         description: Payment not found
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(ApprovePaymentDto),
  paymentController.rejectPayment
);

/**
 * @swagger
 * /payments/manual:
 *   post:
 *     summary: Create a manual payment
 *     description: Record a manual payment (cash, check, etc.). Owner only.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateManualPaymentDto'
 *     responses:
 *       201:
 *         description: Manual payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Manual payment recorded
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.post(
  '/manual',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(CreateManualPaymentDto),
  paymentController.createManualPayment
);

export default router;
