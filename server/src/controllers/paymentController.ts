import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { PaymentService } from '../application/services/PaymentService.js';
import { PaymentGatewayFactory } from '../infrastructure/factories/PaymentGatewayFactory.js';

// Create service instance
const paymentService = new PaymentService(Payment, Tenant, User);

export const initializePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await paymentService.initializePayment(req.body);

    res.json({
      success: true,
      message: 'Payment initialized',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { txRef } = req.params;
    const payment = await paymentService.verifyPayment(txRef);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Legacy webhook handler - defaults to Chapa for backward compatibility
    await paymentService.handleWebhook('chapa', req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const handleChapaWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await paymentService.handleWebhook('chapa', req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const handleTelebirrWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['x-telebirr-signature'] as string;
    await paymentService.handleWebhook('telebirr', req.body, signature);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const handleSantimPayWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['x-santimpay-signature'] as string;
    await paymentService.handleWebhook('santimpay', req.body, signature);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getAvailableGateways = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const gateways = PaymentGatewayFactory.getAvailableGateways();
    const defaultGateway = PaymentGatewayFactory.getDefaultGatewayType();

    res.json({
      success: true,
      data: {
        gateways,
        default: defaultGateway,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await paymentService.getPayments(userId, userRole, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPayment(id);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const createManualPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const payment = await paymentService.createManualPayment({
      ...req.body,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: 'Manual payment recorded',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const year = req.query.year ? Number(req.query.year) : undefined;
    const stats = await paymentService.getPaymentStats(ownerId, year);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const submitBankTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      res.status(400).json({ success: false, message: 'Receipt image is required' });
      return;
    }

    const receiptUrl = (file as any).path || (file as any).secure_url;

    const payment = await paymentService.submitBankTransfer({
      ...req.body,
      amount: Number(req.body.amount),
      month: Number(req.body.month),
      year: Number(req.body.year),
      receiptUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Bank transfer submitted for approval',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const approverId = req.user?._id.toString();

    if (!approverId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const payment = await paymentService.approvePayment(id, approverId, req.body.notes);

    res.json({
      success: true,
      message: 'Payment approved successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const approverId = req.user?._id.toString();

    if (!approverId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const payment = await paymentService.rejectPayment(id, approverId, req.body.notes);

    res.json({
      success: true,
      message: 'Payment rejected',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovalPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await paymentService.getPendingApprovalPayments(ownerId, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;

    const result = await paymentService.getPaymentCalendar(userId, userRole, { year, month });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await paymentService.getPaymentReminders(userId, userRole);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  initializePayment,
  verifyPayment,
  handleWebhook,
  handleChapaWebhook,
  handleTelebirrWebhook,
  handleSantimPayWebhook,
  getAvailableGateways,
  getPayments,
  getPayment,
  createManualPayment,
  getPaymentStats,
  submitBankTransfer,
  approvePayment,
  rejectPayment,
  getPendingApprovalPayments,
  getPaymentCalendar,
  getPaymentReminders,
};
