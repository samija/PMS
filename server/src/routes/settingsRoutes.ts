import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { UpdatePaymentSettingsDto } from '../application/dto/settings/UpdatePaymentSettingsDto.js';

const router = Router();

/**
 * @swagger
 * /settings/banks:
 *   get:
 *     summary: Get supported banks
 *     description: Retrieve list of supported Ethiopian banks for bank transfers. No authentication required.
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Banks retrieved successfully
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
 *                       code:
 *                         type: string
 *                         example: CBE
 *                       name:
 *                         type: string
 *                         example: Commercial Bank of Ethiopia
 */
router.get('/banks', settingsController.getSupportedBanks);

/**
 * @swagger
 * /settings/payment:
 *   get:
 *     summary: Get payment settings
 *     description: Retrieve the owner's payment settings. Owner only.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment settings retrieved successfully
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
 *                     settings:
 *                       $ref: '#/components/schemas/PaymentSettings'
 *                     supportedBanks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                           name:
 *                             type: string
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.get(
  '/payment',
  authenticate,
  authorize('owner', 'admin'),
  settingsController.getPaymentSettings
);

/**
 * @swagger
 * /settings/payment:
 *   put:
 *     summary: Update payment settings
 *     description: Update the owner's payment settings including bank details and preferred payment method. Owner only.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentSettingsDto'
 *     responses:
 *       200:
 *         description: Payment settings updated successfully
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
 *                   example: Payment settings updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/PaymentSettings'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.put(
  '/payment',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(UpdatePaymentSettingsDto),
  settingsController.updatePaymentSettings
);

/**
 * @swagger
 * /settings/owner/{ownerId}/payment-info:
 *   get:
 *     summary: Get owner's payment info for tenants
 *     description: Retrieve payment information for a specific owner. Used by tenants to know how to make payments.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Owner ID
 *     responses:
 *       200:
 *         description: Payment info retrieved successfully
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
 *                     preferredPaymentMethod:
 *                       type: string
 *                       enum: [chapa, telebirr, santimpay, bank_transfer]
 *                     bankDetails:
 *                       $ref: '#/components/schemas/BankDetails'
 *                     paymentInstructions:
 *                       type: string
 *                 message:
 *                   type: string
 *                   description: Message if owner has not configured payment settings
 *       400:
 *         description: Owner ID is required
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/owner/:ownerId/payment-info',
  authenticate,
  settingsController.getOwnerPaymentInfo
);

export default router;
