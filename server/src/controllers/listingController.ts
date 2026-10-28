import { Request, Response } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { ListingService } from '../application/services/ListingService.js';
import { NotFoundError } from '../domain/exceptions/AppError.js';
import { logger } from '../config/logger.js';

const listingService = container.get<ListingService>(TYPES.ListingService);

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, type, city, minPrice, maxPrice, bedrooms, search } = req.query;

    const result = await listingService.getListings({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type as string | undefined,
      city: city as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      search: search as string | undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get listings' });
  }
};

export const getListingDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await listingService.getListingDetail(id);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }
    logger.error('Get listing detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to get listing detail' });
  }
};

export const getListingUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, floor, status = 'vacant' } = req.query;

    const units = await listingService.getListingUnits(id, {
      type: type as string | undefined,
      floor: floor ? Number(floor) : undefined,
      status: status as string | undefined,
    });

    res.json({ success: true, data: units });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }
    logger.error('Get listing units error:', error);
    res.status(500).json({ success: false, message: 'Failed to get units' });
  }
};

export const getFeaturedListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 6 } = req.query;
    const data = await listingService.getFeaturedListings(Number(limit));
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get featured listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get featured listings' });
  }
};

export default {
  getListings,
  getListingDetail,
  getListingUnits,
  getFeaturedListings,
};
