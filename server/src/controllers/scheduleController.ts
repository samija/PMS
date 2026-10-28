import { Request, Response, NextFunction } from 'express';
import { PaymentScheduleService } from '../application/services/PaymentScheduleService.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';

const scheduleService = container.get<PaymentScheduleService>(TYPES.PaymentScheduleService);

export const createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const schedule = await scheduleService.createSchedule({
      ...req.body,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: 'Payment schedule created',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await scheduleService.getSchedules(ownerId, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    const { id } = req.params;

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const schedule = await scheduleService.getSchedule(id, ownerId);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    const { id } = req.params;

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const schedule = await scheduleService.updateSchedule(id, ownerId, req.body);

    res.json({
      success: true,
      message: 'Payment schedule updated',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    const { id } = req.params;

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await scheduleService.deleteSchedule(id, ownerId);

    res.json({
      success: true,
      message: 'Payment schedule deleted',
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedulesForTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.params;

    const schedules = await scheduleService.getSchedulesForTenant(tenantId);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

export const generatePayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    const { id } = req.params;

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Verify schedule belongs to owner
    await scheduleService.getSchedule(id, ownerId);

    const payments = await scheduleService.generatePaymentsForSchedule(id);

    res.json({
      success: true,
      message: `Generated ${payments.length} payment(s)`,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};
