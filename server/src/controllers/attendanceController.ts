import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IAttendanceService } from '../domain/interfaces/IServices.js';

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IAttendanceService>(TYPES.AttendanceService);
    const { propertyId } = req.params;
    const result = await service.checkIn({
      ...req.body,
      propertyId,
      recordedBy: req.user!._id.toString(),
    });
    res.status(201).json({ success: true, message: 'Checked in successfully', data: result });
  } catch (error: any) {
    console.error('Check in error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to check in' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IAttendanceService>(TYPES.AttendanceService);
    const { propertyId } = req.params;
    const result = await service.checkOut({ ...req.body, propertyId });
    res.json({ success: true, message: 'Checked out successfully', data: result });
  } catch (error: any) {
    console.error('Check out error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to check out' });
  }
};

export const getDailyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IAttendanceService>(TYPES.AttendanceService);
    const { propertyId } = req.params;
    const { date } = req.query;
    const data = await service.getDailyAttendance(propertyId, date as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get daily attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance' });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IAttendanceService>(TYPES.AttendanceService);
    const { propertyId } = req.params;
    const { month, year } = req.query;
    const data = await service.getMonthlyReport(propertyId, Number(month), Number(year));
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to get report' });
  }
};

export const getEmployeeAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IAttendanceService>(TYPES.AttendanceService);
    const { id } = req.params;
    const { page, limit, status } = req.query;
    const data = await service.getEmployeeAttendance(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance' });
  }
};
