import { createQueue } from '../../config/queue.js';

export interface EmailJobData {
  type: 'payment_receipt' | 'payment_reminder' | 'welcome_email' | 'maintenance_update';
  to: string;
  subject: string;
  data: Record<string, any>;
}

export interface PaymentJobData {
  type: 'verify_payment' | 'process_webhook';
  paymentId?: string;
  transactionRef?: string;
  gateway?: string;
  webhookData?: Record<string, any>;
}

export interface NotificationJobData {
  type: 'create_notification' | 'bulk_notify';
  userId?: string;
  userIds?: string[];
  title: string;
  message: string;
  notificationType?: string;
  relatedId?: string;
}

export interface ReportJobData {
  type: 'monthly_payment_report' | 'occupancy_report';
  ownerId: string;
  propertyId?: string;
  month?: number;
  year?: number;
}

export const emailQueue = createQueue<EmailJobData>('email', {
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
});

export const paymentQueue = createQueue<PaymentJobData>('payment', {
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 3000 } },
});

export const notificationQueue = createQueue<NotificationJobData>('notification', {
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});

export const reportQueue = createQueue<ReportJobData>('report', {
  defaultJobOptions: { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
});

export const allQueues = [emailQueue, paymentQueue, notificationQueue, reportQueue];

export const closeAllQueues = async (): Promise<void> => {
  await Promise.all(allQueues.map((q) => q.close()));
};
