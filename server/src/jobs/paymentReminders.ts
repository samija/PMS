import cron from 'node-cron';
import { container } from '../config/container.js';
import { IEmailReminderService } from '../domain/interfaces/IServices.js';
import TYPES from '../config/types.js';

/**
 * Initialize payment reminder cron job
 * Runs daily at 8:00 AM to process payment reminders
 */
export const initPaymentReminderJob = (): void => {
  // Schedule: Run at 8:00 AM every day
  // Cron expression: minute hour day-of-month month day-of-week
  const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 8 * * *';

  const isValidSchedule = cron.validate(schedule);
  if (!isValidSchedule) {
    console.error('Invalid cron schedule for payment reminders:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`[${new Date().toISOString()}] Running payment reminder job...`);

    try {
      // Resolve service from container at runtime
      const emailReminderService = container.get<IEmailReminderService>(TYPES.EmailReminderService);
      await emailReminderService.processAllReminders();
      console.log(`[${new Date().toISOString()}] Payment reminder job completed successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Payment reminder job failed:`, error);
    }
  });

  console.log(`Payment reminder cron job initialized with schedule: ${schedule}`);
};

/**
 * Run payment reminders manually (for testing or manual triggers)
 */
export const runPaymentRemindersManually = async (): Promise<void> => {
  console.log('Running payment reminders manually...');
  const emailReminderService = container.get<IEmailReminderService>(TYPES.EmailReminderService);
  await emailReminderService.processAllReminders();
};

export default { initPaymentReminderJob, runPaymentRemindersManually };
