import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { INotification, IPayment, ITenant, IUser } from '../../types/index.js';
import { NotFoundError } from '../../domain/exceptions/AppError.js';
import {
  INotificationService,
  CreateNotificationData,
  NotificationQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

@injectable()
export class NotificationService implements INotificationService {
  private notificationModel: Model<INotification>;
  private tenantModel: Model<ITenant>;
  private userModel: Model<IUser>;

  constructor(
    @inject(TYPES.NotificationModel) notificationModel: Model<INotification>,
    @inject(TYPES.TenantModel) tenantModel: Model<ITenant>,
    @inject(TYPES.UserModel) userModel: Model<IUser>
  ) {
    this.notificationModel = notificationModel;
    this.tenantModel = tenantModel;
    this.userModel = userModel;
  }

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    const { userId, type, title, message, relatedEntity, priority = 'normal', actionUrl, expiresAt } = data;

    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      relatedEntity: relatedEntity
        ? {
            type: relatedEntity.type,
            id: new Types.ObjectId(relatedEntity.id),
          }
        : undefined,
      priority,
      actionUrl,
      expiresAt,
      isRead: false,
    });

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, options: NotificationQueryOptions = {}): Promise<any> {
    const { page = 1, limit = 20, type, isRead } = options;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (type) query.type = type;
    if (typeof isRead === 'boolean') query.isRead = isRead;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification', notificationId);
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modified: number }> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true }
    );

    return { modified: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Notification', notificationId);
    }
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  async deleteOldReadNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationModel.deleteMany({
      isRead: true,
      createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }

  /**
   * Notify tenant about upcoming payment due
   */
  async notifyPaymentDue(payment: IPayment, daysUntilDue: number): Promise<void> {
    const tenant = await this.tenantModel.findById(payment.tenantId);
    if (!tenant) return;

    const dueText = daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;

    await this.createNotification({
      userId: tenant.userId.toString(),
      type: 'payment_due',
      title: 'Payment Due',
      message: `Your ${payment.type} payment of ${payment.amount} ETB is due ${dueText}.`,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: daysUntilDue <= 1 ? 'high' : 'normal',
      actionUrl: `/tenant/payments/${payment._id}`,
    });
  }

  /**
   * Notify tenant about overdue payment
   */
  async notifyPaymentOverdue(payment: IPayment, daysOverdue: number): Promise<void> {
    const tenant = await this.tenantModel.findById(payment.tenantId);
    if (!tenant) return;

    await this.createNotification({
      userId: tenant.userId.toString(),
      type: 'payment_overdue',
      title: 'Payment Overdue',
      message: `Your ${payment.type} payment of ${payment.amount} ETB is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please pay as soon as possible.`,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: daysOverdue > 7 ? 'urgent' : 'high',
      actionUrl: `/tenant/payments/${payment._id}`,
    });

    // Also notify the owner
    await this.createNotification({
      userId: payment.ownerId.toString(),
      type: 'payment_overdue',
      title: 'Tenant Payment Overdue',
      message: `A ${payment.type} payment of ${payment.amount} ETB is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.`,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: daysOverdue > 7 ? 'high' : 'normal',
      actionUrl: `/owner/payments/${payment._id}`,
    });
  }

  /**
   * Notify owner about received payment
   */
  async notifyPaymentReceived(payment: IPayment): Promise<void> {
    await this.createNotification({
      userId: payment.ownerId.toString(),
      type: 'payment_received',
      title: 'Payment Received',
      message: `A ${payment.type} payment of ${payment.amount} ETB has been received.`,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: 'normal',
      actionUrl: `/owner/payments/${payment._id}`,
    });
  }

  /**
   * Notify tenant about approved bank transfer
   */
  async notifyPaymentApproved(payment: IPayment): Promise<void> {
    const tenant = await this.tenantModel.findById(payment.tenantId);
    if (!tenant) return;

    await this.createNotification({
      userId: tenant.userId.toString(),
      type: 'payment_approved',
      title: 'Payment Approved',
      message: `Your bank transfer payment of ${payment.amount} ETB for ${payment.type} has been approved.`,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: 'normal',
      actionUrl: `/tenant/payments/${payment._id}`,
    });
  }

  /**
   * Notify tenant about rejected bank transfer
   */
  async notifyPaymentRejected(payment: IPayment, reason?: string): Promise<void> {
    const tenant = await this.tenantModel.findById(payment.tenantId);
    if (!tenant) return;

    const message = reason
      ? `Your bank transfer payment of ${payment.amount} ETB was rejected. Reason: ${reason}`
      : `Your bank transfer payment of ${payment.amount} ETB was rejected. Please contact the property owner for details.`;

    await this.createNotification({
      userId: tenant.userId.toString(),
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message,
      relatedEntity: {
        type: 'payment',
        id: payment._id.toString(),
      },
      priority: 'high',
      actionUrl: `/tenant/payments/${payment._id}`,
    });
  }
}
