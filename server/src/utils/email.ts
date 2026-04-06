import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('Email configuration incomplete. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

/**
 * Send an email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      logger.info('Email transporter not configured. Skipping email:', options.subject);
      return false;
    }

    const from = process.env.EMAIL_FROM || 'noreply@enderase.com';

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    logger.info('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

/**
 * Payment reminder email template
 */
export const getPaymentReminderTemplate = (data: {
  tenantName: string;
  amount: number;
  dueDate: string;
  propertyName: string;
  unitNumber: string;
  daysUntilDue: number;
  paymentUrl?: string;
}): string => {
  const { tenantName, amount, dueDate, propertyName, unitNumber, daysUntilDue, paymentUrl } = data;

  const urgencyMessage =
    daysUntilDue <= 0
      ? `<p style="color: #dc2626; font-weight: bold;">This payment is overdue by ${Math.abs(daysUntilDue)} day(s)!</p>`
      : daysUntilDue <= 3
      ? `<p style="color: #d97706; font-weight: bold;">This payment is due in ${daysUntilDue} day(s)!</p>`
      : `<p>This payment is due in ${daysUntilDue} day(s).</p>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .payment-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #0ea5e9; }
        .btn { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Hello ${tenantName},</p>

          ${urgencyMessage}

          <div class="payment-details">
            <p><strong>Property:</strong> ${propertyName}</p>
            <p><strong>Unit:</strong> ${unitNumber}</p>
            <p><strong>Amount Due:</strong> <span class="amount">ETB ${amount.toLocaleString()}</span></p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          ${paymentUrl ? `<p style="text-align: center;"><a href="${paymentUrl}" class="btn">Pay Now</a></p>` : ''}

          <p>Please ensure your payment is made on time to avoid any late fees.</p>

          <p>Thank you,<br>Enderase</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Enderase. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Overdue payment warning template
 */
export const getOverdueWarningTemplate = (data: {
  tenantName: string;
  amount: number;
  dueDate: string;
  propertyName: string;
  unitNumber: string;
  daysOverdue: number;
  paymentUrl?: string;
}): string => {
  const { tenantName, amount, dueDate, propertyName, unitNumber, daysOverdue, paymentUrl } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Overdue Payment Notice</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .payment-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
        .btn { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Overdue Payment Notice</h1>
        </div>
        <div class="content">
          <p>Hello ${tenantName},</p>

          <div class="warning">
            <p style="color: #dc2626; font-weight: bold; margin: 0;">
              Your payment is ${daysOverdue} day(s) overdue. Please make the payment immediately to avoid further action.
            </p>
          </div>

          <div class="payment-details">
            <p><strong>Property:</strong> ${propertyName}</p>
            <p><strong>Unit:</strong> ${unitNumber}</p>
            <p><strong>Amount Due:</strong> <span class="amount">ETB ${amount.toLocaleString()}</span></p>
            <p><strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          ${paymentUrl ? `<p style="text-align: center;"><a href="${paymentUrl}" class="btn">Pay Now</a></p>` : ''}

          <p>If you have already made this payment, please disregard this notice and contact us with your payment receipt.</p>

          <p>Thank you,<br>Enderase</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Enderase. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
