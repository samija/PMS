import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IGuardService } from '../domain/interfaces/IServices.js';

export const createShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId } = req.params;
    const assignedBy = req.user!._id;

    const shift = await guardService.createShift({
      ...req.body,
      propertyId,
      assignedBy: assignedBy.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  } catch (error: any) {
    console.error('Create shift error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create shift',
    });
  }
};

export const getShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId } = req.params;
    const { guardId, isActive } = req.query;

    const options: { guardId?: string; isActive?: boolean } = {};
    if (guardId) options.guardId = guardId as string;
    if (isActive !== undefined) options.isActive = isActive === 'true';

    const shifts = await guardService.getShifts(propertyId, options);

    res.json({
      success: true,
      data: shifts,
    });
  } catch (error: any) {
    console.error('Get shifts error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get shifts',
    });
  }
};

export const updateShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId, shiftId } = req.params;
    const data = req.body;

    const shift = await guardService.updateShift(propertyId, shiftId, data);

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shift,
    });
  } catch (error: any) {
    console.error('Update shift error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update shift',
    });
  }
};

export const deleteShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId, shiftId } = req.params;

    await guardService.deleteShift(propertyId, shiftId);

    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete shift error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete shift',
    });
  }
};

export const getWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId } = req.params;

    const schedule = await guardService.getWeeklySchedule(propertyId);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Get weekly schedule error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get weekly schedule',
    });
  }
};

export const getGuardPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guardService = container.get<IGuardService>(TYPES.GuardService);
    const { propertyId } = req.params;

    const posts = await guardService.getGuardPosts(propertyId);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error: any) {
    console.error('Get guard posts error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get guard posts',
    });
  }
};
