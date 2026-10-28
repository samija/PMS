import { Request, Response } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { ILeaveService } from '../domain/interfaces/IServices.js';
import { logger } from '../config/logger.js';

export const submitLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const data = await service.submitRequest(req.body);
    res.status(201).json({ success: true, message: 'Leave request submitted', data });
  } catch (error: any) {
    logger.error('Submit leave request error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to submit request' });
  }
};

export const getLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const { employeeId, propertyId, status, page, limit } = req.query;
    const data = await service.getRequests({
      employeeId: employeeId as string,
      propertyId: propertyId as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Get leave requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get requests' });
  }
};

export const approveLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const { id } = req.params;
    const data = await service.approveRequest(id, req.user!._id.toString());
    res.json({ success: true, message: 'Leave request approved', data });
  } catch (error: any) {
    logger.error('Approve leave error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to approve' });
  }
};

export const rejectLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const { id } = req.params;
    const { reason } = req.body;
    const data = await service.rejectRequest(id, req.user!._id.toString(), reason);
    res.json({ success: true, message: 'Leave request rejected', data });
  } catch (error: any) {
    logger.error('Reject leave error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to reject' });
  }
};

export const cancelLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const { id } = req.params;
    const data = await service.cancelRequest(id, req.user!._id.toString());
    res.json({ success: true, message: 'Leave request cancelled', data });
  } catch (error: any) {
    logger.error('Cancel leave error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to cancel' });
  }
};

export const getLeaveBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<ILeaveService>(TYPES.LeaveService);
    const { id } = req.params;
    const data = await service.getLeaveBalance(id);
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
};
