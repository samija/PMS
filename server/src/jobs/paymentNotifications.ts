import cron from 'node-cron';
import { Types } from 'mongoose';
import { NotificationService } from '../application/services/NotificationService.js';
import Notification from '../models/Notification.js';
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { IPayment } from '../types/index.js';

// Create service instance
const notificationService = new NotificationService(Notification, Tenant, User);

/**
 * Initialize payment notifications cron job
 * Runs daily at 8:00 AM to create in-app notifications for due/overdue payments
 */
export const initPaymentNotificationsJob = (): void => {
  // Schedule: Run at 8:00 AM every day
  const schedule = process.env.PAYMENT_NOTIFICATIONS_CRON_SCHEDULE || '0 8 * * *';

  const isValidSchedule = cron.validate(schedule);
  if (!isValidSchedule) {
    console.error('Invalid cron schedule for payment notifications:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`[${new Date().toISOString()}] Running payment notifications job...`);

    try {
      const result = await processPaymentNotifications();
      console.log(`[${new Date().toISOString()}] Payment notifications job completed: ${result.due} due, ${result.overdue} overdue notifications sent`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Payment notifications job failed:`, error);
    }
  });

  console.log(`Payment notifications cron job initialized with schedule: ${schedule}`);
};

/**
 * Process payment notifications
 */
async function processPaymentNotifications(): Promise<{ due: number; overdue: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueCount = 0;
  let overdueCount = 0;

  // Find payments due in the next 7 days that haven't been notified
  const upcomingDueDate = new Date(today);
  upcomingDueDate.setDate(upcomingDueDate.getDate() + 7);

  const upcomingPayments = await Payment.find({
    status: 'pending',
    dueDate: {
      $gte: today,
      $lte: upcomingDueDate,
    },
    $or: [
      { 'remindersSent': { $not: { $elemMatch: { type: 'upcoming' } } } },
      { 'remindersSent': { $exists: false } },
    ],
  });

  for (const payment of upcomingPayments) {
    const daysUntilDue = Math.ceil(
      (new Date(payment.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Notify at 7 days, 3 days, and 1 day before
    if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
      await notificationService.notifyPaymentDue(payment as IPayment, daysUntilDue);

      // Record that reminder was sent
      await Payment.updateOne(
        { _id: payment._id },
        {
          $push: {
            remindersSent: {
              type: daysUntilDue === 0 ? 'due' : 'upcoming',
              sentAt: new Date(),
              daysBeforeDue: daysUntilDue,
            },
          },
        }
      );

      dueCount++;
    }
  }

  // Find overdue payments
  const overduePayments = await Payment.find({
    status: 'pending',
    dueDate: { $lt: today },
  });

  for (const payment of overduePayments) {
    const daysOverdue = Math.ceil(
      (today.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if we already sent an overdue notification today
    const lastOverdueReminder = payment.remindersSent?.find(
      (r: any) => r.type === 'overdue'
    );

    const shouldNotify = !lastOverdueReminder ||
      (daysOverdue % 7 === 0) || // Weekly reminder
      daysOverdue === 1 ||
      daysOverdue === 3;

    if (shouldNotify) {
      const lastSentDate = lastOverdueReminder?.sentAt;
      const todayStr = today.toDateString();

      // Don't send multiple notifications on the same day
      if (!lastSentDate || new Date(lastSentDate).toDateString() !== todayStr) {
        await notificationService.notifyPaymentOverdue(payment as IPayment, daysOverdue);

        await Payment.updateOne(
          { _id: payment._id },
          {
            $push: {
              remindersSent: {
                type: 'overdue',
                sentAt: new Date(),
                daysBeforeDue: -daysOverdue,
              },
            },
          }
        );

        overdueCount++;
      }
    }
  }

  return { due: dueCount, overdue: overdueCount };
}

/**
 * Run payment notifications manually (for testing)
 */
export const runPaymentNotificationsManually = async (): Promise<{ due: number; overdue: number }> => {
  console.log('Running payment notifications manually...');
  return processPaymentNotifications();
};

export default { initPaymentNotificationsJob, runPaymentNotificationsManually };
