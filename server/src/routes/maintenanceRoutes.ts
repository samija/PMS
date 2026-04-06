import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { CreateMaintenanceRequestDto } from '../application/dto/maintenance/CreateMaintenanceRequestDto.js';
import { UpdateMaintenanceStatusDto } from '../application/dto/maintenance/UpdateMaintenanceStatusDto.js';
import { AssignTechnicianDto } from '../application/dto/maintenance/AssignTechnicianDto.js';
import { CompleteMaintenanceDto } from '../application/dto/maintenance/CompleteMaintenanceDto.js';
import { SubmitFeedbackDto } from '../application/dto/maintenance/SubmitFeedbackDto.js';

const router = Router();

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Create a maintenance request
 *     description: Submit a new maintenance request. Tenant only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMaintenanceRequestDto'
 *     responses:
 *       201:
 *         description: Maintenance request submitted successfully
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
 *                   example: Maintenance request submitted
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (tenant role required)
 */
router.post(
  '/',
  authenticate,
  authorize('tenant'),
  ValidationMiddleware.validate(CreateMaintenanceRequestDto),
  maintenanceController.createMaintenanceRequest
);

/**
 * @swagger
 * /maintenance:
 *   get:
 *     summary: Get all maintenance requests
 *     description: Retrieve maintenance requests. Owners see all requests for their properties, tenants see their own requests.
 *     tags: [Maintenance]
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
 *           enum: [submitted, acknowledged, assigned, in_progress, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, emergency]
 *         description: Filter by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [plumbing, electrical, appliance, structural, hvac, other]
 *         description: Filter by category
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *     responses:
 *       200:
 *         description: Maintenance requests retrieved successfully
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Maintenance'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, maintenanceController.getMaintenanceRequests);

/**
 * @swagger
 * /maintenance/stats/summary:
 *   get:
 *     summary: Get maintenance statistics
 *     description: Retrieve maintenance request statistics. Owner only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance statistics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         submitted:
 *                           type: integer
 *                         acknowledged:
 *                           type: integer
 *                         assigned:
 *                           type: integer
 *                         in_progress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                     byPriority:
 *                       type: object
 *                       properties:
 *                         low:
 *                           type: integer
 *                         medium:
 *                           type: integer
 *                         high:
 *                           type: integer
 *                         emergency:
 *                           type: integer
 *                     byCategory:
 *                       type: object
 *                     averageResolutionTime:
 *                       type: number
 *                       description: Average resolution time in hours
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.get(
  '/stats/summary',
  authenticate,
  authorize('owner', 'admin'),
  maintenanceController.getMaintenanceStats
);

/**
 * @swagger
 * /maintenance/{id}:
 *   get:
 *     summary: Get a single maintenance request
 *     description: Retrieve details of a specific maintenance request
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *     responses:
 *       200:
 *         description: Maintenance request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Maintenance request not found
 */
router.get('/:id', authenticate, maintenanceController.getMaintenanceRequest);

/**
 * @swagger
 * /maintenance/{id}/status:
 *   patch:
 *     summary: Update maintenance request status
 *     description: Update the status of a maintenance request. Owner, admin, or technician only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMaintenanceStatusDto'
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: Status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Maintenance request not found
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('owner', 'admin', 'technician'),
  ValidationMiddleware.validate(UpdateMaintenanceStatusDto),
  maintenanceController.updateMaintenanceStatus
);

/**
 * @swagger
 * /maintenance/{id}/assign:
 *   post:
 *     summary: Assign a technician to a maintenance request
 *     description: Assign a technician to handle a maintenance request. Owner only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignTechnicianDto'
 *     responses:
 *       200:
 *         description: Technician assigned successfully
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
 *                   example: Technician assigned successfully
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 *       404:
 *         description: Maintenance request not found
 */
router.post(
  '/:id/assign',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(AssignTechnicianDto),
  maintenanceController.assignTechnician
);

/**
 * @swagger
 * /maintenance/{id}/complete:
 *   post:
 *     summary: Complete a maintenance request
 *     description: Mark a maintenance request as completed. Owner, admin, or technician only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteMaintenanceDto'
 *     responses:
 *       200:
 *         description: Maintenance request completed
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
 *                   example: Maintenance request completed
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Maintenance request not found
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize('owner', 'admin', 'technician'),
  ValidationMiddleware.validate(CompleteMaintenanceDto),
  maintenanceController.completeMaintenanceRequest
);

/**
 * @swagger
 * /maintenance/{id}/feedback:
 *   post:
 *     summary: Submit feedback for a maintenance request
 *     description: Submit feedback and rating for a completed maintenance request. Tenant only.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitFeedbackDto'
 *     responses:
 *       200:
 *         description: Feedback submitted
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
 *                   example: Feedback submitted
 *                 data:
 *                   $ref: '#/components/schemas/Maintenance'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (tenant role required)
 *       404:
 *         description: Maintenance request not found
 */
router.post(
  '/:id/feedback',
  authenticate,
  authorize('tenant'),
  ValidationMiddleware.validate(SubmitFeedbackDto),
  maintenanceController.submitFeedback
);

export default router;
