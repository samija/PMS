import cron from 'node-cron';
import { NotificationService } from '../application/services/NotificationService.js';
import Notification from '../models/Notification.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';

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
    logger.error('Invalid cron schedule for notification cleanup:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info(`[${new Date().toISOString()}] Running notification cleanup job...`);

    try {
      const daysOld = parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30', 10);
      const deletedCount = await notificationService.deleteOldReadNotifications(daysOld);
      logger.info(`[${new Date().toISOString()}] Notification cleanup job completed: ${deletedCount} notifications deleted`);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Notification cleanup job failed:`, error);
    }
  });

  logger.info(`Notification cleanup cron job initialized with schedule: ${schedule}`);
};

/**
 * Run notification cleanup manually (for testing or manual triggers)
 */
export const runNotificationCleanupManually = async (daysOld: number = 30): Promise<number> => {
  logger.info(`Running notification cleanup manually (deleting notifications older than ${daysOld} days)...`);
  return notificationService.deleteOldReadNotifications(daysOld);
};

export default { initNotificationCleanupJob, runNotificationCleanupManually };
