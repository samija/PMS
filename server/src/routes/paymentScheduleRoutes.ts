import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Create a payment schedule
 *     description: Create a new recurring payment schedule for a tenant. Owner only.
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - propertyId
 *               - unitId
 *               - type
 *               - name
 *               - amount
 *               - dayOfMonth
 *               - startDate
 *             properties:
 *               tenantId:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [rent, utility, maintenance, custom]
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               recurrence:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly, one_time]
 *                 default: monthly
 *               dayOfMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               autoGenerate:
 *                 type: boolean
 *                 default: true
 *               generateAheadMonths:
 *                 type: integer
 *                 default: 3
 *     responses:
 *       201:
 *         description: Payment schedule created
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.createSchedule
);

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all payment schedules
 *     description: Retrieve all payment schedules for the owner
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, utility, maintenance, custom]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Payment schedules retrieved
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.getSchedules
);

/**
 * @swagger
 * /schedules/tenant/{tenantId}:
 *   get:
 *     summary: Get schedules for a tenant
 *     description: Retrieve all active payment schedules for a specific tenant
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment schedules retrieved
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/tenant/:tenantId',
  authenticate,
  scheduleController.getSchedulesForTenant
);

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     summary: Get a payment schedule
 *     description: Retrieve a specific payment schedule by ID
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment schedule retrieved
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Schedule not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.getSchedule
);

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Update a payment schedule
 *     description: Update a payment schedule. Owner only.
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               recurrence:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly, one_time]
 *               dayOfMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *               autoGenerate:
 *                 type: boolean
 *               generateAheadMonths:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment schedule updated
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Schedule not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.updateSchedule
);

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete a payment schedule
 *     description: Deactivate a payment schedule. Owner only.
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment schedule deleted
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Schedule not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.deleteSchedule
);

/**
 * @swagger
 * /schedules/{id}/generate:
 *   post:
 *     summary: Generate payments for a schedule
 *     description: Manually trigger payment generation for a schedule. Owner only.
 *     tags: [Payment Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments generated
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Schedule not found
 */
router.post(
  '/:id/generate',
  authenticate,
  authorize('owner', 'admin'),
  scheduleController.generatePayments
);

export default router;
