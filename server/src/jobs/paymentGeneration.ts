import cron from 'node-cron';
import { PaymentScheduleService } from '../application/services/PaymentScheduleService.js';
import PaymentSchedule from '../models/PaymentSchedule.js';
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import { logger } from '../config/logger.js';

// Create service instance
const scheduleService = new PaymentScheduleService(PaymentSchedule, Payment, Tenant);

/**
 * Initialize payment generation cron job
 * Runs daily at 1:00 AM to generate payments from active schedules
 */
export const initPaymentGenerationJob = (): void => {
  // Schedule: Run at 1:00 AM every day
  // Cron expression: minute hour day-of-month month day-of-week
  const schedule = process.env.PAYMENT_GENERATION_CRON_SCHEDULE || '0 1 * * *';

  const isValidSchedule = cron.validate(schedule);
  if (!isValidSchedule) {
    logger.error('Invalid cron schedule for payment generation:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info(`[${new Date().toISOString()}] Running payment generation job...`);

    try {
      const result = await scheduleService.generateAllPendingPayments();
      logger.info(`[${new Date().toISOString()}] Payment generation job completed: ${result.generated} payments generated from ${result.schedules} schedules`);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Payment generation job failed:`, error);
    }
  });

  logger.info(`Payment generation cron job initialized with schedule: ${schedule}`);
};

/**
 * Run payment generation manually (for testing or manual triggers)
 */
export const runPaymentGenerationManually = async (): Promise<{ generated: number; schedules: number }> => {
  logger.info('Running payment generation manually...');
  return scheduleService.generateAllPendingPayments();
};

export default { initPaymentGenerationJob, runPaymentGenerationManually };
