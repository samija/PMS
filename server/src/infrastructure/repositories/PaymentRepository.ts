import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import {
  IPayment,
  PaymentStatus,
  PaymentType,
  PaymentMethodType,
  BankTransferApprovalStatus,
} from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult, PopulateOptions } from '../../domain/interfaces/IRepository.js';
import { IPaymentRepository, PaymentFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Payment filter options
 */
export { PaymentFilterOptions };

/**
 * Standard populate options for payment queries
 */
const PAYMENT_POPULATE_OPTIONS: PopulateOptions[] = [
  { path: 'tenantId' },
  { path: 'unitId', select: 'unitNumber floor' },
  { path: 'propertyId', select: 'name' },
];

/**
 * Payment Repository
 * Provides data access methods for Payment entities.
 * Extends BaseRepository with payment-specific query methods.
 */
@injectable()
export class PaymentRepository extends BaseRepository<IPayment> implements IPaymentRepository {
  constructor(@inject(TYPES.PaymentModel) model: Model<IPayment>) {
    super(model);
  }

  /**
   * Find payments with pagination and filtering
   * @param filter - Payment filter options
   * @param pagination - Pagination options
   * @returns Paginated payments
   */
  async findWithFilters(
    filter: PaymentFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IPayment>> {
    const query: FilterQuery<IPayment> = {};

    if (filter.ownerId) query.ownerId = this.toObjectId(filter.ownerId);
    if (filter.tenantId) query.tenantId = this.toObjectId(filter.tenantId);
    if (filter.propertyId) query.propertyId = this.toObjectId(filter.propertyId);
    if (filter.unitId) query.unitId = this.toObjectId(filter.unitId);
    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;
    if (filter.paymentMethod) query.paymentMethod = filter.paymentMethod;
    if (filter.month) query.month = filter.month;
    if (filter.year) query.year = filter.year;
    if (filter.bankTransferApprovalStatus) {
      query.bankTransferApprovalStatus = filter.bankTransferApprovalStatus;
    }

    return this.findWithPagination(query, pagination, {
      sort: { createdAt: -1 },
      populate: PAYMENT_POPULATE_OPTIONS,
    });
  }

  /**
   * Find payment by transaction reference
   * @param txRef - Transaction reference (gateway or Chapa)
   * @returns The payment or null
   */
  async findByTransactionRef(txRef: string): Promise<IPayment | null> {
    return this.model.findOne({
      $or: [
        { gatewayTransactionRef: txRef },
        { chapaTxRef: txRef },
      ],
    }).exec();
  }

  /**
   * Find payment by gateway reference
   * @param reference - Gateway reference
   * @returns The payment or null
   */
  async findByGatewayReference(reference: string): Promise<IPayment | null> {
    return this.model.findOne({
      $or: [
        { gatewayReference: reference },
        { chapaReference: reference },
      ],
    }).exec();
  }

  /**
   * Find payments by tenant
   * @param tenantId - The tenant ID
   * @param options - Optional filter options
   * @returns Array of payments
   */
  async findByTenant(
    tenantId: string | Types.ObjectId,
    options?: Omit<PaymentFilterOptions, 'tenantId'>
  ): Promise<IPayment[]> {
    const filter: FilterQuery<IPayment> = {
      tenantId: this.toObjectId(tenantId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;
    if (options?.month) filter.month = options.month;
    if (options?.year) filter.year = options.year;

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find payments by owner
   * @param ownerId - The owner's user ID
   * @param options - Optional filter options
   * @returns Array of payments
   */
  async findByOwner(
    ownerId: string | Types.ObjectId,
    options?: Omit<PaymentFilterOptions, 'ownerId'>
  ): Promise<IPayment[]> {
    const filter: FilterQuery<IPayment> = {
      ownerId: this.toObjectId(ownerId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;
    if (options?.month) filter.month = options.month;
    if (options?.year) filter.year = options.year;

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find payments by property
   * @param propertyId - The property ID
   * @param options - Optional filter options
   * @returns Array of payments
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    options?: Omit<PaymentFilterOptions, 'propertyId'>
  ): Promise<IPayment[]> {
    const filter: FilterQuery<IPayment> = {
      propertyId: this.toObjectId(propertyId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find pending payments
   * @param ownerId - Optional owner filter
   * @returns Array of pending payments
   */
  async findPending(ownerId?: string | Types.ObjectId): Promise<IPayment[]> {
    const filter: FilterQuery<IPayment> = { status: 'pending' };
    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Find overdue payments
   * @param ownerId - Optional owner filter
   * @returns Array of overdue payments
   */
  async findOverdue(ownerId?: string | Types.ObjectId): Promise<IPayment[]> {
    const filter: FilterQuery<IPayment> = {
      status: 'pending',
      dueDate: { $lt: new Date() },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Find upcoming payments
   * @param daysAhead - Number of days to look ahead
   * @param ownerId - Optional owner filter
   * @returns Array of upcoming payments
   */
  async findUpcoming(daysAhead: number, ownerId?: string | Types.ObjectId): Promise<IPayment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const filter: FilterQuery<IPayment> = {
      status: 'pending',
      dueDate: { $gte: today, $lte: futureDate },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(PAYMENT_POPULATE_OPTIONS)
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Find payments pending bank transfer approval
   * @param ownerId - The owner's user ID
   * @param pagination - Optional pagination options
   * @returns Paginated payments pending approval
   */
  async findPendingBankTransferApproval(
    ownerId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPayment>> {
    const filter: FilterQuery<IPayment> = {
      ownerId: this.toObjectId(ownerId),
      paymentMethod: 'bank_transfer',
      bankTransferApprovalStatus: 'pending_approval',
    };

    return this.findWithPagination(
      filter,
      pagination || { page: 1, limit: 10 },
      {
        sort: { createdAt: -1 },
        populate: [
          {
            path: 'tenantId',
            populate: { path: 'userId', select: 'name email' },
          },
          { path: 'unitId', select: 'unitNumber floor' },
          { path: 'propertyId', select: 'name' },
        ],
      }
    );
  }

  /**
   * Update payment status
   * @param paymentId - The payment ID
   * @param status - The new status
   * @returns The updated payment or null
   */
  async updateStatus(
    paymentId: string | Types.ObjectId,
    status: PaymentStatus
  ): Promise<IPayment | null> {
    const update: any = { status };
    if (status === 'completed') {
      update.paidAt = new Date();
    }
    return this.update(paymentId, update);
  }

  /**
   * Mark payment as completed
   * @param paymentId - The payment ID
   * @param gatewayReference - Optional gateway reference
   * @param receiptNumber - Receipt number
   * @returns The updated payment or null
   */
  async markAsCompleted(
    paymentId: string | Types.ObjectId,
    gatewayReference?: string,
    receiptNumber?: string
  ): Promise<IPayment | null> {
    const update: any = {
      status: 'completed',
      paidAt: new Date(),
    };

    if (gatewayReference) {
      update.gatewayReference = gatewayReference;
    }

    if (receiptNumber) {
      update.receipt = {
        number: receiptNumber,
        generatedAt: new Date(),
      };
    }

    return this.update(paymentId, update);
  }

  /**
   * Mark payment as failed
   * @param paymentId - The payment ID
   * @returns The updated payment or null
   */
  async markAsFailed(paymentId: string | Types.ObjectId): Promise<IPayment | null> {
    return this.update(paymentId, { status: 'failed' });
  }

  /**
   * Approve bank transfer payment
   * @param paymentId - The payment ID
   * @param approverId - The approver's user ID
   * @param receiptNumber - Receipt number
   * @param notes - Optional approval notes
   * @returns The updated payment or null
   */
  async approveBankTransfer(
    paymentId: string | Types.ObjectId,
    approverId: string | Types.ObjectId,
    receiptNumber: string,
    notes?: string
  ): Promise<IPayment | null> {
    return this.update(paymentId, {
      status: 'completed',
      bankTransferApprovalStatus: 'approved',
      bankTransferApprovalNotes: notes,
      approvedBy: this.toObjectId(approverId),
      approvedAt: new Date(),
      paidAt: new Date(),
      receipt: {
        number: receiptNumber,
        generatedAt: new Date(),
      },
    });
  }

  /**
   * Reject bank transfer payment
   * @param paymentId - The payment ID
   * @param approverId - The approver's user ID
   * @param notes - Rejection reason
   * @returns The updated payment or null
   */
  async rejectBankTransfer(
    paymentId: string | Types.ObjectId,
    approverId: string | Types.ObjectId,
    notes?: string
  ): Promise<IPayment | null> {
    return this.update(paymentId, {
      status: 'failed',
      bankTransferApprovalStatus: 'rejected',
      bankTransferApprovalNotes: notes,
      approvedBy: this.toObjectId(approverId),
      approvedAt: new Date(),
    });
  }

  /**
   * Find payment for specific month/year
   * @param tenantId - The tenant ID
   * @param type - Payment type
   * @param month - Month number (1-12)
   * @param year - Year
   * @returns The payment or null
   */
  async findByTenantMonthYear(
    tenantId: string | Types.ObjectId,
    type: PaymentType,
    month: number,
    year: number
  ): Promise<IPayment | null> {
    return this.model.findOne({
      tenantId: this.toObjectId(tenantId),
      type,
      month,
      year,
    }).exec();
  }

  /**
   * Get payment statistics by owner
   * @param ownerId - The owner's user ID
   * @param year - The year to get stats for
   * @returns Statistics object
   */
  async getStatsByOwner(ownerId: string | Types.ObjectId, year: number): Promise<{
    monthlyStats: { month: number; status: PaymentStatus; total: number; count: number }[];
    summary: { status: PaymentStatus; total: number; count: number }[];
  }> {
    const ownerObjectId = this.toObjectId(ownerId);

    const [monthlyStats, summary] = await Promise.all([
      this.aggregate<{ _id: { month: number; status: PaymentStatus }; total: number; count: number }>([
        {
          $match: {
            ownerId: ownerObjectId,
            year: year,
          },
        },
        {
          $group: {
            _id: { month: '$month', status: '$status' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
      this.aggregate<{ _id: PaymentStatus; total: number; count: number }>([
        {
          $match: {
            ownerId: ownerObjectId,
            year: year,
          },
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      monthlyStats: monthlyStats.map((s) => ({
        month: s._id.month,
        status: s._id.status,
        total: s.total,
        count: s.count,
      })),
      summary: summary.map((s) => ({
        status: s._id,
        total: s.total,
        count: s.count,
      })),
    };
  }

  /**
   * Get payment calendar data
   * @param filter - Payment filter options
   * @param year - Year
   * @param month - Month
   * @returns Array of payments for the calendar
   */
  async getCalendarData(
    filter: PaymentFilterOptions,
    year: number,
    month: number
  ): Promise<IPayment[]> {
    const query: FilterQuery<IPayment> = {
      year,
      month,
    };

    if (filter.ownerId) query.ownerId = this.toObjectId(filter.ownerId);
    if (filter.tenantId) query.tenantId = this.toObjectId(filter.tenantId);

    return this.model
      .find(query)
      .populate([
        { path: 'unitId', select: 'unitNumber' },
        { path: 'propertyId', select: 'name' },
      ])
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Generate unique receipt number
   * @returns Unique receipt number
   */
  generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  }

  /**
   * Get total revenue by owner
   * @param ownerId - The owner's user ID
   * @param year - Optional year filter
   * @returns Total revenue amount
   */
  async getTotalRevenue(
    ownerId: string | Types.ObjectId,
    year?: number
  ): Promise<number> {
    const filter: FilterQuery<IPayment> = {
      ownerId: this.toObjectId(ownerId),
      status: 'completed',
    };

    if (year) filter.year = year;

    const result = await this.aggregate<{ total: number }>([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result[0]?.total || 0;
  }
}
