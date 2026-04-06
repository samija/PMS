import Bull from 'bull';
import { EmailJobData } from '../index.js';
import logger from '../../../config/logger.js';

// Dynamic import to avoid circular deps
const getEmailUtil = async () => {
  const mod = await import('../../../utils/email.js');
  return mod;
};

export const processEmailJob = async (job: Bull.Job<EmailJobData>): Promise<void> => {
  const { type, to, subject, data } = job.data;

  try {
    const emailUtil = await getEmailUtil();

    let html = '';
    switch (type) {
      case 'payment_receipt':
        html = `<h2>Payment Receipt</h2><p>Amount: ${data.amount} ETB</p><p>Reference: ${data.reference}</p><p>Date: ${data.date}</p>`;
        break;
      case 'payment_reminder':
        if (emailUtil.getPaymentReminderTemplate) {
          html = emailUtil.getPaymentReminderTemplate(data as Parameters<typeof emailUtil.getPaymentReminderTemplate>[0]);
        } else {
          html = `<h2>Payment Reminder</h2><p>Your rent of ${data.amount} ETB is due on ${data.dueDate}.</p>`;
        }
        break;
      case 'welcome_email':
        html = `<h2>Welcome to Enderase!</h2><p>Hi ${data.name}, your account has been created.</p>`;
        break;
      case 'maintenance_update':
        html = `<h2>Maintenance Update</h2><p>Your request "${data.title}" has been updated to: ${data.status}</p>`;
        break;
      default:
        html = `<p>${JSON.stringify(data)}</p>`;
    }

    if (emailUtil.sendEmail) {
      await emailUtil.sendEmail({ to, subject, html });
    }

    logger.info(`[EmailProcessor] Sent ${type} email to ${to}`);
  } catch (error) {
    logger.error(`[EmailProcessor] Failed to send ${type} email to ${to}:`, error);
    throw error; // Will trigger retry
  }
};

export default processEmailJob;
