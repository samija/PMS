import { Router } from 'express';
import { body, param } from 'express-validator';
import * as propertyController from '../controllers/propertyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadPropertyImages, uploadUnitImages } from '../middleware/upload.js';
import { checkPropertyAccess, checkPermission } from '../middleware/propertyAccess.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Create a new property
 *     description: Create a new property. Only owners and admins can create properties.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - address
 *               - totalFloors
 *               - totalUnits
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sunshine Apartments
 *               type:
 *                 type: string
 *                 enum: [apartment, house, commercial, villa]
 *               address:
 *                 type: string
 *                 description: JSON string of address object
 *               totalFloors:
 *                 type: integer
 *                 minimum: 1
 *               totalUnits:
 *                 type: integer
 *                 minimum: 1
 *               amenities:
 *                 type: string
 *                 description: JSON array of amenities
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Property created successfully
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
 *                   example: Property created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Validation error
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
  authorize('owner', 'admin'),
  uploadPropertyImages.array('images', 10),
  validate([
    body('name').notEmpty().withMessage('Property name is required'),
    body('type').isIn(['apartment', 'house', 'commercial', 'villa']).withMessage('Invalid property type'),
    body('totalFloors').isInt({ min: 1 }).withMessage('Total floors must be at least 1'),
    body('totalUnits').isInt({ min: 1 }).withMessage('Total units must be at least 1'),
  ]),
  propertyController.createProperty
);

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties
 *     description: Retrieve all properties accessible to the current user. Owners see their properties, staff see assigned properties.
 *     tags: [Properties]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, commercial, villa]
 *         description: Filter by property type
 *       - in: query
 *         name: isListed
 *         schema:
 *           type: boolean
 *         description: Filter by listing status
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
 *                   type: object
 *                   properties:
 *                     properties:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 */
router.get('/', propertyController.getProperties);

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get a single property
 *     description: Retrieve details of a specific property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this property
 *       404:
 *         description: Property not found
 */
router.get('/:id', checkPropertyAccess, propertyController.getProperty);

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Update a property
 *     description: Update property details. Requires edit permission.
 *     tags: [Properties]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [apartment, house, commercial, villa]
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *               totalFloors:
 *                 type: integer
 *               totalUnits:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
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
 *                   example: Property updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.put('/:id', checkPropertyAccess, checkPermission('edit'), propertyController.updateProperty);

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Delete a property
 *     description: Delete a property. Requires delete permission.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
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
 *                   example: Property deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.delete('/:id', checkPropertyAccess, checkPermission('delete'), propertyController.deleteProperty);

/**
 * @swagger
 * /properties/{id}/listing:
 *   patch:
 *     summary: Toggle property listing status
 *     description: Toggle whether a property is listed publicly
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Listing status toggled successfully
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
 *                   example: Property is now listed
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.patch('/:id/listing', checkPropertyAccess, checkPermission('edit'), propertyController.toggleListing);

/**
 * @swagger
 * /properties/{id}/images:
 *   post:
 *     summary: Upload property images
 *     description: Upload images for a property
 *     tags: [Properties]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
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
 *                   example: Images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     property:
 *                       $ref: '#/components/schemas/Property'
 *       400:
 *         description: No images provided
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  '/:id/images',
  checkPropertyAccess,
  checkPermission('edit'),
  uploadPropertyImages.array('images', 10),
  propertyController.uploadPropertyImages
);

/**
 * @swagger
 * /properties/{id}/images:
 *   delete:
 *     summary: Delete a property image
 *     description: Delete a specific image from a property
 *     tags: [Properties]
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
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: Image deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Image URL is required
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.delete(
  '/:id/images',
  checkPropertyAccess,
  checkPermission('edit'),
  validate([
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
  ]),
  propertyController.deletePropertyImage
);

/**
 * @swagger
 * /properties/{id}/images/primary:
 *   patch:
 *     summary: Set primary image for a property
 *     description: Set an image as the primary/cover image for a property
 *     tags: [Properties]
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
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to set as primary
 *     responses:
 *       200:
 *         description: Primary image set successfully
 *       400:
 *         description: Image URL is required or image not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.patch(
  '/:id/images/primary',
  checkPropertyAccess,
  checkPermission('edit'),
  validate([
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
  ]),
  propertyController.setPrimaryImage
);

/**
 * @swagger
 * /properties/{id}/units:
 *   post:
 *     summary: Add a unit to a property
 *     description: Create a new unit within a property
 *     tags: [Units]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - unitNumber
 *               - type
 *               - floor
 *               - size
 *             properties:
 *               unitNumber:
 *                 type: string
 *                 example: A101
 *               type:
 *                 type: string
 *                 enum: [studio, 1bed, 2bed, 3bed, office, shop, warehouse]
 *               floor:
 *                 type: integer
 *                 minimum: 0
 *               size:
 *                 type: number
 *               pricing:
 *                 type: string
 *                 description: JSON object with basePrice and amenityCharges
 *               features:
 *                 type: string
 *                 description: JSON array of features
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Unit added successfully
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
 *                   example: Unit added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  '/:id/units',
  checkPropertyAccess,
  checkPermission('edit'),
  uploadUnitImages.array('images', 10),
  validate([
    body('unitNumber').notEmpty().withMessage('Unit number is required'),
    body('type').isIn(['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse']).withMessage('Invalid unit type'),
  ]),
  propertyController.addUnit
);

/**
 * @swagger
 * /properties/{id}/units:
 *   get:
 *     summary: Get all units of a property
 *     description: Retrieve all units within a property
 *     tags: [Units]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [vacant, occupied, reserved, maintenance]
 *         description: Filter by unit status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [studio, 1bed, 2bed, 3bed, office, shop, warehouse]
 *         description: Filter by unit type
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *     responses:
 *       200:
 *         description: Units retrieved successfully
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
 *                     $ref: '#/components/schemas/Unit'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get('/:id/units', checkPropertyAccess, propertyController.getUnits);

/**
 * @swagger
 * /properties/{id}/units/{unitId}:
 *   put:
 *     summary: Update a unit
 *     description: Update unit details
 *     tags: [Units]
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
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitNumber:
 *                 type: string
 *               floor:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [studio, 1bed, 2bed, 3bed, office, shop, warehouse]
 *               size:
 *                 type: number
 *               pricing:
 *                 type: object
 *                 properties:
 *                   basePrice:
 *                     type: number
 *                   amenityCharges:
 *                     type: number
 *               status:
 *                 type: string
 *                 enum: [vacant, occupied, reserved, maintenance]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Unit updated successfully
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
 *                   example: Unit updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unit not found
 */
router.put('/:id/units/:unitId', checkPropertyAccess, checkPermission('edit'), propertyController.updateUnit);

/**
 * @swagger
 * /properties/{id}/units/{unitId}:
 *   delete:
 *     summary: Delete a unit
 *     description: Delete a unit from a property
 *     tags: [Units]
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
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     responses:
 *       200:
 *         description: Unit deleted successfully
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
 *                   example: Unit deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unit not found
 */
router.delete('/:id/units/:unitId', checkPropertyAccess, checkPermission('delete'), propertyController.deleteUnit);

/**
 * @swagger
 * /properties/{id}/units/{unitId}/images:
 *   post:
 *     summary: Upload unit images
 *     description: Upload images for a unit
 *     tags: [Units]
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
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
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
 *                   example: Images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     unit:
 *                       $ref: '#/components/schemas/Unit'
 *       400:
 *         description: No images provided
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  '/:id/units/:unitId/images',
  checkPropertyAccess,
  checkPermission('edit'),
  uploadUnitImages.array('images', 10),
  propertyController.uploadUnitImages
);

/**
 * @swagger
 * /properties/{id}/units/{unitId}/images:
 *   delete:
 *     summary: Delete a unit image
 *     description: Delete a specific image from a unit
 *     tags: [Units]
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
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: Image deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       400:
 *         description: Image URL is required
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.delete(
  '/:id/units/:unitId/images',
  checkPropertyAccess,
  checkPermission('edit'),
  validate([
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
  ]),
  propertyController.deleteUnitImage
);

/**
 * @swagger
 * /properties/{id}/units/{unitId}/images/primary:
 *   patch:
 *     summary: Set primary image for a unit
 *     description: Set an image as the primary/cover image for a unit
 *     tags: [Units]
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
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to set as primary
 *     responses:
 *       200:
 *         description: Primary image set successfully
 *       400:
 *         description: Image URL is required or image not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Unit not found
 */
router.patch(
  '/:id/units/:unitId/images/primary',
  checkPropertyAccess,
  checkPermission('edit'),
  validate([
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
  ]),
  propertyController.setUnitPrimaryImage
);

export default router;
