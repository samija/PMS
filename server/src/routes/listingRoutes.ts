import { Router } from 'express';
import * as listingController from '../controllers/listingController.js';

const router = Router();

// Public routes - no authentication required

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all property listings
 *     description: Retrieve all publicly listed properties. No authentication required.
 *     tags: [Listings]
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
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, commercial, villa]
 *         description: Filter by property type
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *         description: Filter by number of bedrooms
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, and city
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
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
 *                     listings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Listing'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', listingController.getListings);

/**
 * @swagger
 * /listings/featured:
 *   get:
 *     summary: Get featured listings
 *     description: Retrieve featured property listings (properties with most available units). No authentication required.
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of featured listings to return
 *     responses:
 *       200:
 *         description: Featured listings retrieved successfully
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
 *                     $ref: '#/components/schemas/Listing'
 */
router.get('/featured', listingController.getFeaturedListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing detail
 *     description: Retrieve detailed information about a specific listing. No authentication required.
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Listing detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Listing'
 *                     - type: object
 *                       properties:
 *                         availableUnits:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Unit'
 *                         waitingListCount:
 *                           type: integer
 *       404:
 *         description: Listing not found
 */
router.get('/:id', listingController.getListingDetail);

/**
 * @swagger
 * /listings/{id}/units:
 *   get:
 *     summary: Get listing units
 *     description: Retrieve available units for a specific listing. No authentication required.
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [vacant, occupied, reserved, maintenance]
 *           default: vacant
 *         description: Filter by unit status
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
 *       404:
 *         description: Listing not found
 */
router.get('/:id/units', listingController.getListingUnits);

export default router;
