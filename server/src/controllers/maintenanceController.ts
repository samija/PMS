import { Request, Response, NextFunction } from 'express';
import Maintenance from '../models/Maintenance.js';
import Tenant from '../models/Tenant.js';
import Property from '../models/Property.js';
import PropertyStaff from '../models/PropertyStaff.js';
import { MaintenanceService } from '../application/services/MaintenanceService.js';

// Create service instance
const maintenanceService = new MaintenanceService(Maintenance, Tenant, Property, PropertyStaff);

export const createMaintenanceRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const maintenance = await maintenanceService.createMaintenanceRequest({
      ...req.body,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await maintenanceService.getMaintenanceRequests(userId, userRole, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await maintenanceService.getMaintenanceRequest(id);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const request = await maintenanceService.updateMaintenanceStatus({
      requestId: id,
      userId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const request = await maintenanceService.assignTechnician({
      requestId: id,
      ownerId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Technician assigned successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const completeMaintenanceRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const request = await maintenanceService.completeMaintenanceRequest({
      requestId: id,
      userId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Maintenance request completed',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const request = await maintenanceService.submitFeedback({
      requestId: id,
      userId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Feedback submitted',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const stats = await maintenanceService.getMaintenanceStats(ownerId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequest,
  updateMaintenanceStatus,
  assignTechnician,
  completeMaintenanceRequest,
  submitFeedback,
  getMaintenanceStats,
};
