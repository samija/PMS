import { PaymentGatewayType } from '../domain/interfaces/IPaymentGateway.js';

/**
 * Payment Logger Utility
 * Centralized logging for payment operations
 */

interface LogContext {
  gatewayType: PaymentGatewayType;
  transactionRef?: string;
  amount?: number;
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

/**
 * Log levels
 */
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * Base logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In production, this should integrate with a proper logging service
  // (e.g., Winston, Pino, CloudWatch, etc.)
  const logString = JSON.stringify(logEntry, null, 2);

  switch (level) {
    case LogLevel.ERROR:
      console.error(`[PAYMENT ERROR] ${logString}`);
      break;
    case LogLevel.WARN:
      console.warn(`[PAYMENT WARN] ${logString}`);
      break;
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[PAYMENT DEBUG] ${logString}`);
      }
      break;
    case LogLevel.INFO:
    default:
      console.log(`[PAYMENT INFO] ${logString}`);
      break;
  }
}

/**
 * Log payment initialization
 */
export function logInitialization(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  amount: number,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Payment initialization started', {
    gatewayType,
    transactionRef,
    amount,
    ...context,
  });
}

/**
 * Log successful payment initialization
 */
export function logInitializationSuccess(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  checkoutUrl: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Payment initialization successful', {
    gatewayType,
    transactionRef,
    checkoutUrl,
    ...context,
  });
}

/**
 * Log payment initialization failure
 */
export function logInitializationFailure(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  error: Error,
  context?: Partial<LogContext>
): void {
  log(LogLevel.ERROR, 'Payment initialization failed', {
    gatewayType,
    transactionRef,
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Log payment verification
 */
export function logVerification(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Payment verification started', {
    gatewayType,
    transactionRef,
    ...context,
  });
}

/**
 * Log successful payment verification
 */
export function logVerificationSuccess(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  status: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Payment verification successful', {
    gatewayType,
    transactionRef,
    status,
    ...context,
  });
}

/**
 * Log payment verification failure
 */
export function logVerificationFailure(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  error: Error,
  context?: Partial<LogContext>
): void {
  log(LogLevel.ERROR, 'Payment verification failed', {
    gatewayType,
    transactionRef,
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Log webhook received
 */
export function logWebhook(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  status: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Webhook received', {
    gatewayType,
    transactionRef,
    status,
    ...context,
  });
}

/**
 * Log webhook signature verification failure
 */
export function logWebhookSignatureFailure(
  gatewayType: PaymentGatewayType,
  context?: Partial<LogContext>
): void {
  log(LogLevel.WARN, 'Webhook signature verification failed', {
    gatewayType,
    ...context,
  });
}

/**
 * Log webhook processing success
 */
export function logWebhookSuccess(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.INFO, 'Webhook processed successfully', {
    gatewayType,
    transactionRef,
    ...context,
  });
}

/**
 * Log webhook processing failure
 */
export function logWebhookFailure(
  gatewayType: PaymentGatewayType,
  transactionRef: string,
  error: Error,
  context?: Partial<LogContext>
): void {
  log(LogLevel.ERROR, 'Webhook processing failed', {
    gatewayType,
    transactionRef,
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Log gateway API error
 */
export function logGatewayError(
  gatewayType: PaymentGatewayType,
  operation: string,
  error: any,
  context?: Partial<LogContext>
): void {
  log(LogLevel.ERROR, `Gateway ${operation} error`, {
    gatewayType,
    operation,
    error: error.message || error,
    gatewayResponse: error.response?.data,
    statusCode: error.response?.status,
    ...context,
  });
}

/**
 * Log debug information (only in development)
 */
export function logDebug(
  gatewayType: PaymentGatewayType,
  message: string,
  context?: Partial<LogContext>
): void {
  log(LogLevel.DEBUG, message, {
    gatewayType,
    ...context,
  });
}
