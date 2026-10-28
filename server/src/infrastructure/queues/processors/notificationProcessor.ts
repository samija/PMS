import Bull from 'bull';
import { NotificationJobData } from '../index.js';
import Notification from '../../../models/Notification.js';
import { logger } from '../../../config/logger.js';

export const processNotificationJob = async (job: Bull.Job<NotificationJobData>): Promise<void> => {
  const { type, userId, userIds, title, message, notificationType, relatedId } = job.data;

  try {

    switch (type) {
      case 'create_notification': {
        if (!userId) throw new Error('userId required for create_notification');
        await Notification.create({
          user: userId,
          title,
          message,
          type: notificationType || 'general',
          relatedId,
        });
        logger.info(`[NotificationProcessor] Created notification for user ${userId}`);
        break;
      }
      case 'bulk_notify': {
        if (!userIds || userIds.length === 0) throw new Error('userIds required for bulk_notify');
        const notifications = userIds.map((uid) => ({
          user: uid,
          title,
          message,
          type: notificationType || 'general',
          relatedId,
        }));
        await Notification.insertMany(notifications);
        logger.info(`[NotificationProcessor] Created ${userIds.length} bulk notifications`);
        break;
      }
      default:
        logger.warn(`[NotificationProcessor] Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error(`[NotificationProcessor] Failed to process ${type}:`, error);
    throw error;
  }
};

export default processNotificationJob;
