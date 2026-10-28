import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPayment, ITenant, IUser } from '../../types/index.js';
import { sendEmail, getPaymentReminderTemplate, getOverdueWarningTemplate } from '../../utils/email.js';
import { IEmailReminderService } from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';
import { logger } from '../../config/logger.js';

interface PaymentWithRelations {
  _id: Types.ObjectId;
  amount: number;
  dueDate: Date;
  tenantId: {
    _id: Types.ObjectId;
    userId: {
      name: string;
      email: string;
    };
  };
  propertyId: {
    name: string;
  };
  unitId: {
    unitNumber: string;
  };
}

@injectable()
export class EmailReminderService implements IEmailReminderService {
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
   * Send a payment reminder email to a tenant
   */
  async sendPaymentReminder(
    payment: PaymentWithRelations,
    daysUntilDue: number
  ): Promise<boolean> {
    try {
      const tenant = payment.tenantId;
      const user = tenant?.userId;

      if (!user?.email) {
        logger.info('No email found for tenant:', payment.tenantId);
        return false;
      }

      const template = getPaymentReminderTemplate({
        tenantName: user.name || 'Tenant',
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        propertyName: payment.propertyId?.name || 'Property',
        unitNumber: payment.unitId?.unitNumber || 'Unit',
        daysUntilDue,
        paymentUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/tenant/payments` : undefined,
      });

      const subject =
        daysUntilDue <= 0
          ? `[URGENT] Payment Overdue - ${Math.abs(daysUntilDue)} Days`
          : daysUntilDue <= 3
          ? `[Reminder] Payment Due in ${daysUntilDue} Days`
          : `Payment Reminder - Due in ${daysUntilDue} Days`;

      return await sendEmail({
        to: user.email,
        subject,
        html: template,
      });
    } catch (error) {
      logger.error('Error sending payment reminder:', error);
      return false;
    }
  }

  /**
   * Send overdue payment warning
   */
  async sendOverdueWarning(payment: PaymentWithRelations, daysOverdue: number): Promise<boolean> {
    try {
      const tenant = payment.tenantId;
      const user = tenant?.userId;

      if (!user?.email) {
        logger.info('No email found for tenant:', payment.tenantId);
        return false;
      }

      const template = getOverdueWarningTemplate({
        tenantName: user.name || 'Tenant',
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        propertyName: payment.propertyId?.name || 'Property',
        unitNumber: payment.unitId?.unitNumber || 'Unit',
        daysOverdue,
        paymentUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/tenant/payments` : undefined,
      });

      return await sendEmail({
        to: user.email,
        subject: `[URGENT] Overdue Payment - ${daysOverdue} Days Past Due`,
        html: template,
      });
    } catch (error) {
      logger.error('Error sending overdue warning:', error);
      return false;
    }
  }

  /**
   * Process all upcoming payment reminders
   * Sends reminders at: 7 days before, 3 days before, and on due date
   */
  async processUpcomingReminders(): Promise<{ sent: number; failed: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reminder schedule: 7 days, 3 days, 0 days before due date
    const reminderDays = [7, 3, 0];

    let sent = 0;
    let failed = 0;

    for (const daysBeforeDue of reminderDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysBeforeDue);

      // Find payments due on target date that are still pending
      const payments = await this.paymentModel
        .find({
          status: 'pending',
          dueDate: {
            $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        })
        .populate({
          path: 'tenantId',
          populate: {
            path: 'userId',
            select: 'name email',
          },
        })
        .populate('propertyId', 'name')
        .populate('unitId', 'unitNumber')
        .lean();

      for (const payment of payments as unknown as PaymentWithRelations[]) {
        const success = await this.sendPaymentReminder(payment, daysBeforeDue);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Process overdue payments and send warnings
   * Sends warnings for payments overdue by 1, 3, 7, 14, and 30 days
   */
  async processOverdueReminders(): Promise<{ sent: number; failed: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Warning schedule: 1, 3, 7, 14, 30 days overdue
    const warningDays = [1, 3, 7, 14, 30];

    let sent = 0;
    let failed = 0;

    for (const daysOverdue of warningDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysOverdue);

      // Find payments that were due on target date and are still pending
      const payments = await this.paymentModel
        .find({
          status: 'pending',
          dueDate: {
            $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        })
        .populate({
          path: 'tenantId',
          populate: {
            path: 'userId',
            select: 'name email',
          },
        })
        .populate('propertyId', 'name')
        .populate('unitId', 'unitNumber')
        .lean();

      for (const payment of payments as unknown as PaymentWithRelations[]) {
        const success = await this.sendOverdueWarning(payment, daysOverdue);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Main method to run all reminder processing
   */
  async processAllReminders(): Promise<void> {
    logger.info('Starting payment reminder processing...');

    const upcomingResult = await this.processUpcomingReminders();
    logger.info(`Upcoming reminders: ${upcomingResult.sent} sent, ${upcomingResult.failed} failed`);

    const overdueResult = await this.processOverdueReminders();
    logger.info(`Overdue warnings: ${overdueResult.sent} sent, ${overdueResult.failed} failed`);

    logger.info('Payment reminder processing completed');
  }
}
