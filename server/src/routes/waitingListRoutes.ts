import { Router } from 'express';
import * as waitingListController from '../controllers/waitingListController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { ApplyToWaitingListDto } from '../application/dto/waitinglist/ApplyToWaitingListDto.js';
import { OfferUnitDto } from '../application/dto/waitinglist/OfferUnitDto.js';
import { RespondToOfferDto } from '../application/dto/waitinglist/RespondToOfferDto.js';
import { UpdateWaitingListStatusDto } from '../application/dto/waitinglist/UpdateWaitingListStatusDto.js';

const router = Router();

/**
 * @swagger
 * /waitlist/apply:
 *   post:
 *     summary: Apply to waiting list
 *     description: Apply to join a property's waiting list. Any authenticated user can apply.
 *     tags: [Waiting List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyToWaitingListDto'
 *     responses:
 *       201:
 *         description: Successfully added to waiting list
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
 *                   example: Successfully added to waiting list
 *                 data:
 *                   $ref: '#/components/schemas/WaitingListEntry'
 *       400:
 *         description: Validation error or already on waiting list
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/apply',
  authenticate,
  ValidationMiddleware.validate(ApplyToWaitingListDto),
  waitingListController.applyToWaitingList
);

/**
 * @swagger
 * /waitlist:
 *   get:
 *     summary: Get waiting list
 *     description: Retrieve the waiting list for all properties owned by the user. Owner only.
 *     tags: [Waiting List]
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
 *           enum: [waiting, offered, accepted, rejected, expired]
 *         description: Filter by status
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [queue, application]
 *         description: Filter by application type
 *     responses:
 *       200:
 *         description: Waiting list retrieved successfully
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WaitingListEntry'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.get(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  waitingListController.getWaitingList
);

/**
 * @swagger
 * /waitlist/my-applications:
 *   get:
 *     summary: Get my waiting list applications
 *     description: Retrieve the current user's waiting list applications
 *     tags: [Waiting List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
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
 *                     $ref: '#/components/schemas/WaitingListEntry'
 *       401:
 *         description: Not authenticated
 */
router.get('/my-applications', authenticate, waitingListController.getMyApplications);

/**
 * @swagger
 * /waitlist/{id}/offer:
 *   post:
 *     summary: Offer a unit to an applicant
 *     description: Offer a specific unit to a waiting list applicant. Owner only.
 *     tags: [Waiting List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Waiting list entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfferUnitDto'
 *     responses:
 *       200:
 *         description: Offer sent successfully
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
 *                   example: Offer sent successfully
 *                 data:
 *                   $ref: '#/components/schemas/WaitingListEntry'
 *       400:
 *         description: Validation error or unit not available
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 *       404:
 *         description: Waiting list entry not found
 */
router.post(
  '/:id/offer',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(OfferUnitDto),
  waitingListController.offerUnit
);

/**
 * @swagger
 * /waitlist/{id}/respond:
 *   post:
 *     summary: Respond to a unit offer
 *     description: Accept or decline a unit offer
 *     tags: [Waiting List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Waiting list entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RespondToOfferDto'
 *     responses:
 *       200:
 *         description: Response recorded successfully
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
 *                   example: Offer accepted
 *                 data:
 *                   $ref: '#/components/schemas/WaitingListEntry'
 *       400:
 *         description: Validation error or no pending offer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the applicant for this entry
 *       404:
 *         description: Waiting list entry not found
 */
router.post(
  '/:id/respond',
  authenticate,
  ValidationMiddleware.validate(RespondToOfferDto),
  waitingListController.respondToOffer
);

/**
 * @swagger
 * /waitlist/{id}/status:
 *   patch:
 *     summary: Update waiting list entry status
 *     description: Manually update the status of a waiting list entry. Owner only.
 *     tags: [Waiting List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Waiting list entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWaitingListStatusDto'
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
 *                   $ref: '#/components/schemas/WaitingListEntry'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 *       404:
 *         description: Waiting list entry not found
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(UpdateWaitingListStatusDto),
  waitingListController.updateWaitingListStatus
);

export default router;
