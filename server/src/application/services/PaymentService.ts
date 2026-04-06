import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPayment, ITenant, IUser } from '../../types/index.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import { chapaService } from '../../config/chapa.js';
import { PaymentGatewayFactory } from '../../infrastructure/factories/PaymentGatewayFactory.js';
import { PaymentGatewayType } from '../../domain/interfaces/IPaymentGateway.js';
import {
  IPaymentService,
  InitializePaymentData,
  InitializePaymentResult,
  CreateManualPaymentData,
  PaymentQueryOptions,
  SubmitBankTransferData,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type { InitializePaymentData, InitializePaymentResult, CreateManualPaymentData, PaymentQueryOptions, SubmitBankTransferData };

export interface WebhookData {
  tx_ref: string;
  status: string;
  reference: string;
}

@injectable()
export class PaymentService implements IPaymentService {
  private paymentModel: Model<IPayment>;
  private tenantModel: Model<ITenant>;
  private userModel: Model<IUser>;

  constructor(
    @inject(TYPES.PaymentModel) paymentModel: Model<IPayment>,
    @inject(TYPES.TenantModel) tenantModel: Model<ITenant>,
    @inject(TYPES.UserModel) userModel: Model<IUser>
  ) {
    this.paymentModel = paymentModel;
    this.tenantModel = tenantModel;
    this.userModel = userModel;
  }

  /**
   * Initialize payment with selected gateway
   */
  async initializePayment(data: InitializePaymentData): Promise<InitializePaymentResult> {
    const { tenantId, amount, type, month, year, dueDate, gateway } = data;

    // Get tenant with populated relations
    const tenant = await this.tenantModel
      .findById(tenantId)
      .populate('userId', 'email name')
      .populate('unitId')
      .populate('propertyId');

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Get user for email (gateway requirement)
    const user = await this.userModel.findById(tenant.userId);
    if (!user) {
      throw new NotFoundError('User associated with tenant');
    }

    // Determine which gateway to use
    const gatewayType = gateway || PaymentGatewayFactory.getDefaultGatewayType();
    const paymentGateway = PaymentGatewayFactory.getGateway(gatewayType);

    // Generate unique transaction reference
    const txRef = paymentGateway.generateTransactionRef('ENDER');

    // Create pending payment record
    const paymentData: any = {
      tenantId: new Types.ObjectId(tenantId),
      unitId: tenant.unitId,
      propertyId: tenant.propertyId,
      ownerId: tenant.ownerId,
      amount,
      type,
      status: 'pending',
      paymentMethod: gatewayType,
      gatewayTransactionRef: txRef,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      month,
      year,
    };

    // For backward compatibility with Chapa
    if (gatewayType === 'chapa') {
      paymentData.chapaTxRef = txRef;
    }

    const payment = await this.paymentModel.create(paymentData);

    // Initialize payment with gateway
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || 'Tenant';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const gatewayResponse = await paymentGateway.initializePayment({
      amount,
      currency: 'ETB',
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      txRef: txRef,
      callbackUrl: `${baseUrl}/api/payments/webhook/${gatewayType}`,
      returnUrl: `${frontendUrl}/payment/success?tx_ref=${txRef}`,
      customization: {
        title: 'Enderase Payment',
        description: `${type} payment for ${month}/${year}`,
      },
    });

    // Update payment with gateway reference if provided
    if (gatewayResponse.gatewayReference) {
      payment.gatewayReference = gatewayResponse.gatewayReference;
      payment.gatewayMetadata = gatewayResponse.metadata;
      await payment.save();
    }

    return {
      payment,
      checkoutUrl: gatewayResponse.checkoutUrl,
    };
  }

  /**
   * Verify payment with appropriate gateway and update status
   */
  async verifyPayment(txRef: string): Promise<IPayment> {
    // Find payment by transaction reference (check both new and legacy fields)
    const payment = await this.paymentModel.findOne({
      $or: [
        { gatewayTransactionRef: txRef },
        { chapaTxRef: txRef }
      ]
    });

    if (!payment) {
      throw new NotFoundError('Payment', txRef);
    }

    // Get appropriate gateway based on payment method
    const gatewayType = payment.paymentMethod as PaymentGatewayType;
    const paymentGateway = PaymentGatewayFactory.getGateway(gatewayType);

    // Verify with gateway
    const gatewayResponse = await paymentGateway.verifyPayment(txRef);

    if (!gatewayResponse.success || gatewayResponse.status !== 'success') {
      // Update payment as failed
      payment.status = 'failed';
      await payment.save();

      throw new BadRequestError('Payment verification failed');
    }

    // Generate receipt and update payment as completed
    const receiptNumber = this.generateReceiptNumber();

    payment.status = 'completed';
    payment.gatewayReference = gatewayResponse.gatewayReference;
    payment.paidAt = gatewayResponse.paidAt || new Date();
    payment.gatewayMetadata = gatewayResponse.metadata;
    payment.receipt = {
      number: receiptNumber,
      generatedAt: new Date(),
    };

    // For backward compatibility with Chapa
    if (gatewayType === 'chapa') {
      payment.chapaReference = gatewayResponse.gatewayReference;
    }

    await payment.save();

    return payment;
  }

  /**
   * Handle webhook callback from payment gateway
   */
  async handleWebhook(gatewayType: PaymentGatewayType, data: any, signature?: string): Promise<void> {
    // Get appropriate gateway
    const paymentGateway = PaymentGatewayFactory.getGateway(gatewayType);

    // Verify webhook signature
    const isValid = await paymentGateway.verifyWebhookSignature(data, signature);
    if (!isValid) {
      console.error('Invalid webhook signature from', gatewayType);
      throw new BadRequestError('Invalid webhook signature');
    }

    // Parse webhook data
    const webhookData = paymentGateway.parseWebhookData(data);

    // Find payment by transaction reference
    const payment = await this.paymentModel.findOne({
      $or: [
        { gatewayTransactionRef: webhookData.transactionRef },
        { chapaTxRef: webhookData.transactionRef }
      ]
    });

    if (!payment) {
      console.error('Payment not found for webhook:', webhookData.transactionRef);
      return;
    }

    // Update payment based on status
    if (webhookData.status === 'success' || webhookData.status === 'SUCCESS') {
      const receiptNumber = this.generateReceiptNumber();

      payment.status = 'completed';
      payment.gatewayReference = webhookData.gatewayReference;
      payment.paidAt = new Date();
      payment.gatewayMetadata = webhookData.metadata;
      payment.receipt = {
        number: receiptNumber,
        generatedAt: new Date(),
      };

      // For backward compatibility with Chapa
      if (gatewayType === 'chapa') {
        payment.chapaReference = webhookData.gatewayReference;
      }

      await payment.save();
    } else {
      payment.status = 'failed';
      await payment.save();
    }
  }

  /**
   * Get payments with role-based filtering and pagination
   */
  async getPayments(userId: string, userRole: string, options: PaymentQueryOptions = {}) {
    const { page = 1, limit = 10, status, type, tenantId, propertyId, month, year, bankTransferApprovalStatus } = options;

    // Build query based on user role
    const query: any = {};

    if (userRole === 'owner' || userRole === 'admin') {
      // Owner sees all their properties' payments
      query.ownerId = new Types.ObjectId(userId);
    } else if (userRole === 'tenant') {
      // Tenant sees only their own payments
      const tenant = await this.tenantModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (tenant) {
        query.tenantId = tenant._id;
      } else {
        // No active tenancy, return empty result
        return {
          payments: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0,
          },
        };
      }
    }

    // Apply additional filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (tenantId) query.tenantId = new Types.ObjectId(tenantId);
    if (propertyId) query.propertyId = new Types.ObjectId(propertyId);
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (bankTransferApprovalStatus) query.bankTransferApprovalStatus = bankTransferApprovalStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate('tenantId')
        .populate('unitId', 'unitNumber floor')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.paymentModel.countDocuments(query),
    ]);

    return {
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get single payment by ID
   */
  async getPayment(paymentId: string): Promise<IPayment> {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('tenantId')
      .populate('unitId', 'unitNumber floor type')
      .populate('propertyId', 'name address')
      .lean();

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    return payment as unknown as IPayment;
  }

  /**
   * Create manual payment record (for cash/bank transfer)
   */
  async createManualPayment(data: CreateManualPaymentData): Promise<IPayment> {
    const { tenantId, ownerId, amount, type, month, year, dueDate, notes } = data;

    // Verify tenant belongs to owner
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Generate receipt number
    const receiptNumber = this.generateReceiptNumber();

    // Create completed payment record
    const payment = await this.paymentModel.create({
      tenantId: new Types.ObjectId(tenantId),
      unitId: tenant.unitId,
      propertyId: tenant.propertyId,
      ownerId: new Types.ObjectId(ownerId),
      amount,
      type,
      status: 'completed',
      paymentMethod: 'manual',
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      paidAt: new Date(),
      month,
      year,
      receipt: {
        number: receiptNumber,
        generatedAt: new Date(),
      },
    });

    return payment;
  }

  /**
   * Submit bank transfer payment with receipt
   */
  async submitBankTransfer(data: SubmitBankTransferData): Promise<IPayment> {
    const { tenantId, amount, type, month, year, dueDate, receiptUrl } = data;

    // Get tenant with populated relations
    const tenant = await this.tenantModel.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Create payment with pending_approval status
    const payment = await this.paymentModel.create({
      tenantId: new Types.ObjectId(tenantId),
      unitId: tenant.unitId,
      propertyId: tenant.propertyId,
      ownerId: tenant.ownerId,
      amount,
      type,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      bankTransferReceipt: receiptUrl,
      bankTransferApprovalStatus: 'pending_approval',
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      month,
      year,
    });

    return payment;
  }

  /**
   * Approve bank transfer payment
   */
  async approvePayment(paymentId: string, approverId: string, notes?: string): Promise<IPayment> {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.paymentMethod !== 'bank_transfer') {
      throw new BadRequestError('Only bank transfer payments can be approved');
    }

    if (payment.bankTransferApprovalStatus !== 'pending_approval') {
      throw new BadRequestError('Payment is not pending approval');
    }

    // Generate receipt number
    const receiptNumber = this.generateReceiptNumber();

    payment.status = 'completed';
    payment.bankTransferApprovalStatus = 'approved';
    payment.bankTransferApprovalNotes = notes;
    payment.approvedBy = new Types.ObjectId(approverId);
    payment.approvedAt = new Date();
    payment.paidAt = new Date();
    payment.receipt = {
      number: receiptNumber,
      generatedAt: new Date(),
    };

    await payment.save();

    return payment;
  }

  /**
   * Reject bank transfer payment
   */
  async rejectPayment(paymentId: string, approverId: string, notes?: string): Promise<IPayment> {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.paymentMethod !== 'bank_transfer') {
      throw new BadRequestError('Only bank transfer payments can be rejected');
    }

    if (payment.bankTransferApprovalStatus !== 'pending_approval') {
      throw new BadRequestError('Payment is not pending approval');
    }

    payment.status = 'failed';
    payment.bankTransferApprovalStatus = 'rejected';
    payment.bankTransferApprovalNotes = notes;
    payment.approvedBy = new Types.ObjectId(approverId);
    payment.approvedAt = new Date();

    await payment.save();

    return payment;
  }

  /**
   * Get payments pending approval for owner
   */
  async getPendingApprovalPayments(ownerId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;

    const query = {
      ownerId: new Types.ObjectId(ownerId),
      paymentMethod: 'bank_transfer',
      bankTransferApprovalStatus: 'pending_approval',
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate({
          path: 'tenantId',
          populate: {
            path: 'userId',
            select: 'name email',
          },
        })
        .populate('unitId', 'unitNumber floor')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.paymentModel.countDocuments(query),
    ]);

    return {
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get payment statistics for owner dashboard
   */
  async getPaymentStats(ownerId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    // Monthly breakdown by status
    const monthlyStats = await this.paymentModel.aggregate([
      {
        $match: {
          ownerId: new Types.ObjectId(ownerId),
          year: Number(targetYear),
        },
      },
      {
        $group: {
          _id: {
            month: '$month',
            status: '$status',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Overall summary by status
    const summary = await this.paymentModel.aggregate([
      {
        $match: {
          ownerId: new Types.ObjectId(ownerId),
          year: Number(targetYear),
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      monthlyStats,
      summary,
    };
  }

  /**
   * Generate unique receipt number
   */
  private generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  }

  /**
   * Get payment calendar data for a specific month
   */
  async getPaymentCalendar(userId: string, userRole: string, options: { year: number; month: number }) {
    const { year, month } = options;

    // Build query based on user role
    const query: any = {
      year: Number(year),
      month: Number(month),
    };

    if (userRole === 'owner' || userRole === 'admin') {
      query.ownerId = new Types.ObjectId(userId);
    } else if (userRole === 'tenant') {
      const tenant = await this.tenantModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!tenant) {
        return { payments: [], days: {} };
      }
      query.tenantId = tenant._id;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('unitId', 'unitNumber')
      .populate('propertyId', 'name')
      .sort({ dueDate: 1 })
      .lean();

    // Group payments by day
    const days: Record<number, any[]> = {};
    const today = new Date();

    payments.forEach((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      const dayOfMonth = dueDate.getDate();

      // Determine color indicator
      let indicator: 'green' | 'yellow' | 'red' = 'yellow';
      if (payment.status === 'completed') {
        indicator = 'green';
      } else if (payment.status === 'pending' && dueDate < today) {
        indicator = 'red'; // Overdue
      }

      if (!days[dayOfMonth]) {
        days[dayOfMonth] = [];
      }

      days[dayOfMonth].push({
        _id: payment._id,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        dueDate: payment.dueDate,
        paidAt: payment.paidAt,
        indicator,
        propertyName: payment.propertyId?.name,
        unitNumber: payment.unitId?.unitNumber,
      });
    });

    return { payments, days };
  }

  /**
   * Get payment reminders (upcoming and overdue)
   */
  async getPaymentReminders(userId: string, userRole: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date 30 days from now
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // Build query based on user role
    const query: any = {
      status: 'pending',
      $or: [
        { dueDate: { $lt: today } }, // Overdue
        { dueDate: { $gte: today, $lte: thirtyDaysLater } }, // Upcoming
      ],
    };

    if (userRole === 'owner' || userRole === 'admin') {
      query.ownerId = new Types.ObjectId(userId);
    } else if (userRole === 'tenant') {
      const tenant = await this.tenantModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!tenant) {
        return { upcoming: [], overdue: [] };
      }
      query.tenantId = tenant._id;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('unitId', 'unitNumber')
      .populate('propertyId', 'name')
      .sort({ dueDate: 1 })
      .lean();

    const upcoming: any[] = [];
    const overdue: any[] = [];

    payments.forEach((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const reminder = {
        _id: payment._id,
        amount: payment.amount,
        type: payment.type,
        dueDate: payment.dueDate,
        daysUntilDue: diffDays,
        isOverdue: diffDays < 0,
        propertyName: payment.propertyId?.name,
        unitNumber: payment.unitId?.unitNumber,
        month: payment.month,
        year: payment.year,
      };

      if (diffDays < 0) {
        overdue.push(reminder);
      } else {
        upcoming.push(reminder);
      }
    });

    return { upcoming, overdue };
  }
}
