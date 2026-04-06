import {
  IPaymentGateway,
  PaymentGatewayType,
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from '../interfaces/IPaymentGateway.js';

/**
 * Base Payment Gateway
 * Provides common functionality for all payment gateway implementations
 */
export abstract class BasePaymentGateway implements IPaymentGateway {
  protected gatewayType: PaymentGatewayType;

  constructor(gatewayType: PaymentGatewayType) {
    this.gatewayType = gatewayType;
  }

  /**
   * Get the gateway type identifier
   */
  getType(): PaymentGatewayType {
    return this.gatewayType;
  }

  /**
   * Generate a unique transaction reference
   * Format: {PREFIX}-{TIMESTAMP}-{RANDOM}
   */
  generateTransactionRef(prefix: string = 'ENDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validate common payment fields
   */
  protected validatePaymentPayload(payload: PaymentInitializationPayload): void {
    if (!payload.amount || payload.amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    if (!payload.email || !this.isValidEmail(payload.email)) {
      throw new Error('Invalid email address');
    }

    if (!payload.txRef || payload.txRef.trim() === '') {
      throw new Error('Transaction reference is required');
    }

    if (!payload.firstName || payload.firstName.trim() === '') {
      throw new Error('First name is required');
    }

    if (!payload.callbackUrl || !this.isValidUrl(payload.callbackUrl)) {
      throw new Error('Invalid callback URL');
    }

    if (!payload.returnUrl || !this.isValidUrl(payload.returnUrl)) {
      throw new Error('Invalid return URL');
    }
  }

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse>;
  abstract verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse>;
  abstract verifyWebhookSignature(payload: any, signature?: string): Promise<boolean>;
  abstract parseWebhookData(payload: any): WebhookPayload;
}
