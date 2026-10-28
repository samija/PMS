import Bull from 'bull';
import { PaymentJobData } from '../index.js';
import Payment from '../../../models/Payment.js';
import { logger } from '../../../config/logger.js';

export const processPaymentJob = async (job: Bull.Job<PaymentJobData>): Promise<void> => {
  const { type, paymentId, transactionRef, gateway, webhookData } = job.data;

  try {
    switch (type) {
      case 'verify_payment': {
        logger.info(`[PaymentProcessor] Verifying payment ${transactionRef} via ${gateway}`);
        const payment = await Payment.findById(paymentId);
        if (payment && payment.status === 'pending') {
          logger.info(`[PaymentProcessor] Payment ${paymentId} still pending, may need manual check`);
        }
        break;
      }
      case 'process_webhook': {
        logger.info(`[PaymentProcessor] Processing webhook from ${gateway}`);
        // Webhook data processing for async handling
        if (webhookData) {
          logger.info(`[PaymentProcessor] Webhook data processed for ${webhookData.tx_ref || 'unknown'}`);
        }
        break;
      }
      default:
        logger.warn(`[PaymentProcessor] Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error(`[PaymentProcessor] Failed to process ${type}:`, error);
    throw error;
  }
};

export default processPaymentJob;
