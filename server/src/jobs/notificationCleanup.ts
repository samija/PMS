import cron from 'node-cron';
import { NotificationService } from '../application/services/NotificationService.js';
import Notification from '../models/Notification.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';

// Create service instance
const notificationService = new NotificationService(Notification, Tenant, User);

/**
 * Initialize notification cleanup cron job
 * Runs weekly on Sunday at 2:00 AM to delete old read notifications
 */
export const initNotificationCleanupJob = (): void => {
  // Schedule: Run at 2:00 AM every Sunday
  // Cron expression: minute hour day-of-month month day-of-week
  const schedule = process.env.NOTIFICATION_CLEANUP_CRON_SCHEDULE || '0 2 * * 0';

  const isValidSchedule = cron.validate(schedule);
  if (!isValidSchedule) {
    console.error('Invalid cron schedule for notification cleanup:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`[${new Date().toISOString()}] Running notification cleanup job...`);

    try {
      const daysOld = parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30', 10);
      const deletedCount = await notificationService.deleteOldReadNotifications(daysOld);
      console.log(`[${new Date().toISOString()}] Notification cleanup job completed: ${deletedCount} notifications deleted`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Notification cleanup job failed:`, error);
    }
  });

  console.log(`Notification cleanup cron job initialized with schedule: ${schedule}`);
};

/**
 * Run notification cleanup manually (for testing or manual triggers)
 */
export const runNotificationCleanupManually = async (daysOld: number = 30): Promise<number> => {
  console.log(`Running notification cleanup manually (deleting notifications older than ${daysOld} days)...`);
  return notificationService.deleteOldReadNotifications(daysOld);
};

export default { initNotificationCleanupJob, runNotificationCleanupManually };
