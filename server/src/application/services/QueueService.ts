import {
  emailQueue,
  paymentQueue,
  notificationQueue,
  reportQueue,
  EmailJobData,
  PaymentJobData,
  NotificationJobData,
  ReportJobData,
} from '../../infrastructure/queues/index.js';

export class QueueService {
  async sendEmail(type: EmailJobData['type'], to: string, subject: string, data: Record<string, any>): Promise<void> {
    try {
      await emailQueue.add({ type, to, subject, data }, { priority: type === 'payment_receipt' ? 1 : 2 });
    } catch (err) {
      console.warn('[QueueService] Failed to enqueue email (falling back to direct send):', err);
    }
  }

  async processPayment(type: PaymentJobData['type'], data: Omit<PaymentJobData, 'type'>): Promise<void> {
    try {
      await paymentQueue.add({ type, ...data }, { priority: 1 });
    } catch (err) {
      console.warn('[QueueService] Failed to enqueue payment job:', err);
    }
  }

  async sendNotification(type: NotificationJobData['type'], data: Omit<NotificationJobData, 'type'>): Promise<void> {
    try {
      await notificationQueue.add({ type, ...data });
    } catch (err) {
      console.warn('[QueueService] Failed to enqueue notification:', err);
    }
  }

  async generateReport(type: ReportJobData['type'], data: Omit<ReportJobData, 'type'>): Promise<void> {
    try {
      await reportQueue.add({ type, ...data }, { delay: 1000 });
    } catch (err) {
      console.warn('[QueueService] Failed to enqueue report:', err);
    }
  }
}

export const queueService = new QueueService();
export default queueService;
