import { Router } from 'express';
import { body } from 'express-validator';
import * as staffController from '../controllers/staffController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess, canManageStaff } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /staff/properties/{id}/staff:
 *   post:
 *     summary: Add staff to a property
 *     description: Add a staff member to a property. Property owner only.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddStaffDto'
 *     responses:
 *       201:
 *         description: Staff added successfully
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
 *                   example: Staff added successfully
 *                 data:
 *                   $ref: '#/components/schemas/PropertyStaff'
 *       400:
 *         description: Validation error or user already assigned
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to manage staff
 *       404:
 *         description: User or property not found
 */
router.post(
  '/properties/:id/staff',
  checkPropertyAccess,
  canManageStaff,
  validate([
    body('userId').notEmpty().withMessage('User ID is required'),
    body('role').isIn(['manager', 'marketing', 'technician', 'guard', 'cleaner']).withMessage('Invalid staff role'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  ]),
  staffController.addStaff
);

/**
 * @swagger
 * /staff/properties/{id}/staff:
 *   get:
 *     summary: Get property staff
 *     description: Retrieve all staff members assigned to a property
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [manager, marketing, technician, guard, cleaner]
 *         description: Filter by staff role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
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
 *                     $ref: '#/components/schemas/PropertyStaff'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this property
 */
router.get(
  '/properties/:id/staff',
  checkPropertyAccess,
  staffController.getPropertyStaff
);

/**
 * @swagger
 * /staff/properties/{id}/staff/{staffId}:
 *   put:
 *     summary: Update staff role/permissions
 *     description: Update a staff member's role or permissions. Property owner only.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffDto'
 *     responses:
 *       200:
 *         description: Staff updated successfully
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
 *                   example: Staff updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/PropertyStaff'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to manage staff
 *       404:
 *         description: Staff assignment not found
 */
router.put(
  '/properties/:id/staff/:staffId',
  checkPropertyAccess,
  canManageStaff,
  validate([
    body('role').optional().isIn(['manager', 'marketing', 'technician', 'guard', 'cleaner']),
    body('permissions').optional().isArray(),
  ]),
  staffController.updateStaff
);

/**
 * @swagger
 * /staff/properties/{id}/staff/{staffId}:
 *   delete:
 *     summary: Remove staff from property
 *     description: Remove a staff member from a property. Property owner only.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff assignment ID
 *     responses:
 *       200:
 *         description: Staff removed successfully
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
 *                   example: Staff removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to manage staff
 *       404:
 *         description: Staff assignment not found
 */
router.delete(
  '/properties/:id/staff/:staffId',
  checkPropertyAccess,
  canManageStaff,
  staffController.removeStaff
);

/**
 * @swagger
 * /staff/staff/my-properties:
 *   get:
 *     summary: Get properties for staff member
 *     description: Retrieve all properties the current user is assigned to as staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
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
 *                       _id:
 *                         type: string
 *                       propertyId:
 *                         $ref: '#/components/schemas/Property'
 *                       role:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Not authenticated
 */
router.get('/staff/my-properties', staffController.getStaffProperties);

/**
 * @swagger
 * /staff/staff:
 *   get:
 *     summary: Get all staff
 *     description: Retrieve all staff members across all properties. Admin only.
 *     tags: [Staff]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [manager, marketing, technician, guard, cleaner]
 *         description: Filter by staff role
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
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
 *                     staff:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PropertyStaff'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.get('/staff', staffController.getAllStaff);

export default router;
