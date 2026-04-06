import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IPerformanceService } from '../domain/interfaces/IServices.js';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IPerformanceService>(TYPES.PerformanceService);
    const { propertyId } = req.params;
    const data = await service.createReview({
      ...req.body,
      propertyId,
      reviewerId: req.user!._id.toString(),
    });
    res.status(201).json({ success: true, message: 'Review created', data });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create review' });
  }
};

export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IPerformanceService>(TYPES.PerformanceService);
    const { propertyId } = req.params;
    const { employeeId, page, limit } = req.query;
    const data = await service.getReviews(propertyId, {
      employeeId: employeeId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reviews' });
  }
};

export const getReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IPerformanceService>(TYPES.PerformanceService);
    const { propertyId, id } = req.params;
    const data = await service.getReview(propertyId, id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get review error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to get review' });
  }
};

export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IPerformanceService>(TYPES.PerformanceService);
    const { propertyId, id } = req.params;
    const data = await service.updateReview(propertyId, id, req.body);
    res.json({ success: true, message: 'Review updated', data });
  } catch (error: any) {
    console.error('Update review error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update review' });
  }
};

export const submitReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IPerformanceService>(TYPES.PerformanceService);
    const { propertyId, id } = req.params;
    const data = await service.submitReview(propertyId, id);
    res.json({ success: true, message: 'Review submitted', data });
  } catch (error: any) {
    console.error('Submit review error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to submit review' });
  }
};
