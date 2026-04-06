import { Router } from 'express';
import * as tenantController from '../controllers/tenantController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { CreateTenantDto } from '../application/dto/tenant/CreateTenantDto.js';
import { UpdateTenantDto } from '../application/dto/tenant/UpdateTenantDto.js';
import { uploadTenantDocument } from '../middleware/upload.js';

const router = Router();

/**
 * @swagger
 * /tenants:
 *   post:
 *     summary: Create a new tenant
 *     description: Create a new tenant and assign them to a property unit. Only owners and admins can create tenants.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantDto'
 *     responses:
 *       201:
 *         description: Tenant created successfully
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
 *                   example: Tenant added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error or unit not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (owner or admin role required)
 */
router.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(CreateTenantDto),
  tenantController.createTenant
);

/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants
 *     description: Retrieve all tenants for the authenticated owner
 *     tags: [Tenants]
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
 *           enum: [active, pending, terminated]
 *         description: Filter by tenant status
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
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
 *                     tenants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tenant'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  tenantController.getTenants
);

/**
 * @swagger
 * /tenants/my/tenancy:
 *   get:
 *     summary: Get current user's tenancy
 *     description: Retrieve tenancy details for the currently authenticated tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenancy details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (tenant role required)
 *       404:
 *         description: No active tenancy found
 */
router.get(
  '/my/tenancy',
  authenticate,
  authorize('tenant'),
  tenantController.getMyTenancy
);

/**
 * @swagger
 * /tenants/{id}:
 *   get:
 *     summary: Get a single tenant
 *     description: Retrieve details of a specific tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  tenantController.getTenant
);

/**
 * @swagger
 * /tenants/{id}:
 *   put:
 *     summary: Update a tenant
 *     description: Update tenant details including lease agreement and emergency contact
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTenantDto'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
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
 *                   example: Tenant updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  ValidationMiddleware.validate(UpdateTenantDto),
  tenantController.updateTenant
);

/**
 * @swagger
 * /tenants/{id}/terminate:
 *   post:
 *     summary: Terminate a tenant
 *     description: Terminate a tenant's lease and mark the unit as vacant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant terminated successfully
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
 *                   example: Tenant terminated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant not found
 */
router.post(
  '/:id/terminate',
  authenticate,
  authorize('owner', 'admin'),
  tenantController.terminateTenant
);

/**
 * @swagger
 * /tenants/{id}/documents:
 *   post:
 *     summary: Upload a document for a tenant
 *     description: Upload agreement files, ID documents, etc.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - type
 *               - name
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [agreement, national_id, passport, other]
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant not found
 */
router.post(
  '/:id/documents',
  authenticate,
  authorize('owner', 'admin'),
  uploadTenantDocument.single('document'),
  tenantController.uploadDocument
);

/**
 * @swagger
 * /tenants/{id}/documents:
 *   get:
 *     summary: Get all documents for a tenant
 *     description: Retrieve all uploaded documents for a tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant not found
 */
router.get(
  '/:id/documents',
  authenticate,
  authorize('owner', 'admin'),
  tenantController.getDocuments
);

/**
 * @swagger
 * /tenants/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a tenant document
 *     description: Delete a specific document from a tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Tenant or document not found
 */
router.delete(
  '/:id/documents/:docId',
  authenticate,
  authorize('owner', 'admin'),
  tenantController.deleteDocument
);

export default router;
