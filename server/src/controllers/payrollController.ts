import { Request, Response } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IPayrollService } from '../domain/interfaces/IServices.js';
import { logger } from '../config/logger.js';

export const generatePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<IPayrollService>(TYPES.PayrollService);
    const { propertyId } = req.params;
    const { month, year } = req.body;
    const data = await service.generatePayroll({ propertyId, month, year });
    res.status(201).json({ success: true, message: 'Payroll generated', data });
  } catch (error: any) {
    logger.error('Generate payroll error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to generate payroll' });
  }
};

export const getPayrollRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<IPayrollService>(TYPES.PayrollService);
    const { propertyId } = req.params;
    const { month, year, status, page, limit } = req.query;
    const data = await service.getPayrollRecords(propertyId, {
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Get payroll records error:', error);
    res.status(500).json({ success: false, message: 'Failed to get records' });
  }
};

export const getPayrollDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<IPayrollService>(TYPES.PayrollService);
    const { propertyId, id } = req.params;
    const data = await service.getPayrollDetail(propertyId, id);
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Get payroll detail error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to get detail' });
  }
};

export const approvePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<IPayrollService>(TYPES.PayrollService);
    const { propertyId, id } = req.params;
    const data = await service.approvePayroll(propertyId, id, req.user!._id.toString());
    res.json({ success: true, message: 'Payroll approved', data });
  } catch (error: any) {
    logger.error('Approve payroll error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to approve' });
  }
};

export const markPayrollAsPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = container.get<IPayrollService>(TYPES.PayrollService);
    const { propertyId, id } = req.params;
    const { paymentMethod, transactionRef } = req.body;
    const data = await service.markAsPaid(propertyId, id, req.user!._id.toString(), paymentMethod, transactionRef);
    res.json({ success: true, message: 'Payroll marked as paid', data });
  } catch (error: any) {
    logger.error('Mark payroll as paid error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to mark as paid' });
  }
};
