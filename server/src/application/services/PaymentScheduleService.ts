import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPaymentSchedule, IPayment, ITenant } from '../../types/index.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import {
  IPaymentScheduleService,
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

@injectable()
export class PaymentScheduleService implements IPaymentScheduleService {
  private scheduleModel: Model<IPaymentSchedule>;
  private paymentModel: Model<IPayment>;
  private tenantModel: Model<ITenant>;

  constructor(
    @inject(TYPES.PaymentScheduleModel) scheduleModel: Model<IPaymentSchedule>,
    @inject(TYPES.PaymentModel) paymentModel: Model<IPayment>,
    @inject(TYPES.TenantModel) tenantModel: Model<ITenant>
  ) {
    this.scheduleModel = scheduleModel;
    this.paymentModel = paymentModel;
    this.tenantModel = tenantModel;
  }

  /**
   * Create a new payment schedule
   */
  async createSchedule(data: CreateScheduleData): Promise<IPaymentSchedule> {
    const { tenantId, propertyId, unitId, ownerId, type, name, amount, recurrence, dayOfMonth, startDate, endDate, autoGenerate = true, generateAheadMonths = 3 } = data;

    // Validate day of month
    if (dayOfMonth < 1 || dayOfMonth > 28) {
      throw new BadRequestError('Day of month must be between 1 and 28');
    }

    // Verify tenant exists and belongs to owner
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    const schedule = await this.scheduleModel.create({
      tenantId: new Types.ObjectId(tenantId),
      propertyId: new Types.ObjectId(propertyId),
      unitId: new Types.ObjectId(unitId),
      ownerId: new Types.ObjectId(ownerId),
      type,
      name,
      amount,
      recurrence,
      dayOfMonth,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      autoGenerate,
      generateAheadMonths,
    });

    // If autoGenerate is enabled, generate initial payments
    if (autoGenerate) {
      await this.generatePaymentsForSchedule(schedule._id.toString());
    }

    return schedule;
  }

  /**
   * Get all schedules for an owner
   */
  async getSchedules(ownerId: string, options: ScheduleQueryOptions = {}): Promise<any> {
    const { page = 1, limit = 10, tenantId, propertyId, type, isActive } = options;

    const query: any = { ownerId: new Types.ObjectId(ownerId) };

    if (tenantId) query.tenantId = new Types.ObjectId(tenantId);
    if (propertyId) query.propertyId = new Types.ObjectId(propertyId);
    if (type) query.type = type;
    if (typeof isActive === 'boolean') query.isActive = isActive;

    const skip = (Number(page) - 1) * Number(limit);

    const [schedules, total] = await Promise.all([
      this.scheduleModel
        .find(query)
        .populate('tenantId')
        .populate('propertyId', 'name')
        .populate('unitId', 'unitNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.scheduleModel.countDocuments(query),
    ]);

    return {
      schedules,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(scheduleId: string, ownerId: string): Promise<IPaymentSchedule> {
    const schedule = await this.scheduleModel
      .findOne({
        _id: new Types.ObjectId(scheduleId),
        ownerId: new Types.ObjectId(ownerId),
      })
      .populate('tenantId')
      .populate('propertyId', 'name')
      .populate('unitId', 'unitNumber');

    if (!schedule) {
      throw new NotFoundError('PaymentSchedule', scheduleId);
    }

    return schedule;
  }

  /**
   * Update a payment schedule
   */
  async updateSchedule(scheduleId: string, ownerId: string, data: UpdateScheduleData): Promise<IPaymentSchedule> {
    const schedule = await this.scheduleModel.findOne({
      _id: new Types.ObjectId(scheduleId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!schedule) {
      throw new NotFoundError('PaymentSchedule', scheduleId);
    }

    // Validate day of month if provided
    if (data.dayOfMonth !== undefined && (data.dayOfMonth < 1 || data.dayOfMonth > 28)) {
      throw new BadRequestError('Day of month must be between 1 and 28');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.autoGenerate !== undefined) updateData.autoGenerate = data.autoGenerate;
    if (data.generateAheadMonths !== undefined) updateData.generateAheadMonths = data.generateAheadMonths;

    const updated = await this.scheduleModel
      .findByIdAndUpdate(scheduleId, updateData, { new: true })
      .populate('tenantId')
      .populate('propertyId', 'name')
      .populate('unitId', 'unitNumber');

    return updated!;
  }

  /**
   * Delete a payment schedule (soft delete by deactivating)
   */
  async deleteSchedule(scheduleId: string, ownerId: string): Promise<void> {
    const schedule = await this.scheduleModel.findOne({
      _id: new Types.ObjectId(scheduleId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!schedule) {
      throw new NotFoundError('PaymentSchedule', scheduleId);
    }

    // Soft delete by deactivating
    schedule.isActive = false;
    await schedule.save();
  }

  /**
   * Get schedules for a specific tenant
   */
  async getSchedulesForTenant(tenantId: string): Promise<IPaymentSchedule[]> {
    const schedules = await this.scheduleModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        isActive: true,
      })
      .populate('propertyId', 'name')
      .populate('unitId', 'unitNumber')
      .sort({ type: 1, name: 1 });

    return schedules;
  }

  /**
   * Generate payments for a specific schedule
   */
  async generatePaymentsForSchedule(scheduleId: string): Promise<IPayment[]> {
    const schedule = await this.scheduleModel.findById(scheduleId);

    if (!schedule || !schedule.isActive) {
      return [];
    }

    const generatedPayments: IPayment[] = [];
    const today = new Date();
    const endDate = schedule.endDate || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    // Calculate how far ahead to generate
    const generateUntil = new Date(today);
    generateUntil.setMonth(generateUntil.getMonth() + schedule.generateAheadMonths);

    // Don't generate past the schedule end date
    const finalDate = endDate < generateUntil ? endDate : generateUntil;

    // Get the starting point for generation
    let currentDate = schedule.lastGeneratedDate
      ? new Date(schedule.lastGeneratedDate)
      : new Date(schedule.startDate);

    // Move to the next period if we have a lastGeneratedDate
    if (schedule.lastGeneratedDate) {
      currentDate = this.getNextRecurrenceDate(currentDate, schedule.recurrence);
    }

    while (currentDate <= finalDate) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Calculate due date based on day of month
      const dueDate = new Date(year, month - 1, schedule.dayOfMonth);

      // Check if payment already exists for this period
      const existingPayment = await this.paymentModel.findOne({
        scheduleId: schedule._id,
        month,
        year,
      });

      if (!existingPayment) {
        try {
          const payment = await this.paymentModel.create({
            tenantId: schedule.tenantId,
            unitId: schedule.unitId,
            propertyId: schedule.propertyId,
            ownerId: schedule.ownerId,
            amount: schedule.amount,
            type: schedule.type === 'custom' ? 'utility' : schedule.type,
            status: 'pending',
            paymentMethod: 'chapa',
            dueDate,
            month,
            year,
            scheduleId: schedule._id,
            isAutoGenerated: true,
          });

          generatedPayments.push(payment);
        } catch (error: any) {
          // Skip if duplicate (race condition)
          if (error.code !== 11000) {
            throw error;
          }
        }
      }

      // Move to next recurrence
      if (schedule.recurrence === 'one_time') {
        break;
      }

      currentDate = this.getNextRecurrenceDate(currentDate, schedule.recurrence);
    }

    // Update lastGeneratedDate
    if (generatedPayments.length > 0) {
      schedule.lastGeneratedDate = new Date();
      await schedule.save();
    }

    return generatedPayments;
  }

  /**
   * Generate all pending payments for active schedules (cron job method)
   */
  async generateAllPendingPayments(): Promise<{ generated: number; schedules: number }> {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setMonth(cutoffDate.getMonth() - 1); // Generate if not generated in last month

    // Find active schedules that need generation
    const schedules = await this.scheduleModel.find({
      isActive: true,
      autoGenerate: true,
      $or: [
        { lastGeneratedDate: { $lt: cutoffDate } },
        { lastGeneratedDate: { $exists: false } },
      ],
    });

    let totalGenerated = 0;

    for (const schedule of schedules) {
      const payments = await this.generatePaymentsForSchedule(schedule._id.toString());
      totalGenerated += payments.length;
    }

    return {
      generated: totalGenerated,
      schedules: schedules.length,
    };
  }

  /**
   * Create default rent schedule when tenant is created
   */
  async createDefaultScheduleForTenant(
    tenantId: string,
    ownerId: string,
    propertyId: string,
    unitId: string,
    monthlyRent: number,
    leaseStartDate: Date
  ): Promise<IPaymentSchedule> {
    return this.createSchedule({
      tenantId,
      ownerId,
      propertyId,
      unitId,
      type: 'rent',
      name: 'Monthly Rent',
      amount: monthlyRent,
      recurrence: 'monthly',
      dayOfMonth: 1,
      startDate: leaseStartDate,
      autoGenerate: true,
      generateAheadMonths: 3,
    });
  }

  /**
   * Calculate next recurrence date
   */
  private getNextRecurrenceDate(currentDate: Date, recurrence: string): Date {
    const next = new Date(currentDate);

    switch (recurrence) {
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }

    return next;
  }
}
