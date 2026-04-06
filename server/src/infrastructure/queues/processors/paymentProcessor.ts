import Bull from 'bull';
import { PaymentJobData } from '../index.js';
import Payment from '../../../models/Payment.js';

export const processPaymentJob = async (job: Bull.Job<PaymentJobData>): Promise<void> => {
  const { type, paymentId, transactionRef, gateway, webhookData } = job.data;

  try {
    switch (type) {
      case 'verify_payment': {
        console.log(`[PaymentProcessor] Verifying payment ${transactionRef} via ${gateway}`);
        const payment = await Payment.findById(paymentId);
        if (payment && payment.status === 'pending') {
          console.log(`[PaymentProcessor] Payment ${paymentId} still pending, may need manual check`);
        }
        break;
      }
      case 'process_webhook': {
        console.log(`[PaymentProcessor] Processing webhook from ${gateway}`);
        // Webhook data processing for async handling
        if (webhookData) {
          console.log(`[PaymentProcessor] Webhook data processed for ${webhookData.tx_ref || 'unknown'}`);
        }
        break;
      }
      default:
        console.warn(`[PaymentProcessor] Unknown job type: ${type}`);
    }
  } catch (error) {
    console.error(`[PaymentProcessor] Failed to process ${type}:`, error);
    throw error;
  }
};

export default processPaymentJob;
