/**
 * Payment Gateway Interface
 * Defines the contract that all payment gateway implementations must follow
 */

export type PaymentGatewayType = 'chapa' | 'telebirr' | 'santimpay';

/**
 * Standard payment initialization payload
 */
export interface PaymentInitializationPayload {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

/**
 * Standard payment initialization response
 */
export interface PaymentInitializationResponse {
  success: boolean;
  checkoutUrl: string;
  transactionRef: string;
  gatewayReference?: string;
  metadata?: Record<string, any>;
}

/**
 * Standard payment verification response
 */
export interface PaymentVerificationResponse {
  success: boolean;
  status: 'success' | 'failed' | 'pending';
  transactionRef: string;
  gatewayReference: string;
  amount: number;
  currency: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Standard webhook data structure
 */
export interface WebhookPayload {
  transactionRef: string;
  status: string;
  gatewayReference: string;
  amount?: number;
  metadata?: Record<string, any>;
}

/**
 * Payment Gateway Interface
 * All payment gateway implementations must implement this interface
 */
export interface IPaymentGateway {
  /**
   * Get the gateway type identifier
   */
  getType(): PaymentGatewayType;

  /**
   * Initialize a payment transaction
   * @param payload - Standard payment initialization data
   * @returns Payment initialization response with checkout URL
   */
  initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse>;

  /**
   * Verify a payment transaction
   * @param transactionRef - Transaction reference to verify
   * @returns Payment verification response
   */
  verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse>;

  /**
   * Verify webhook signature (if supported by gateway)
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature from headers
   * @returns True if signature is valid, false otherwise
   */
  verifyWebhookSignature(payload: any, signature?: string): Promise<boolean>;

  /**
   * Parse webhook data into standard format
   * @param payload - Raw webhook payload
   * @returns Parsed webhook data
   */
  parseWebhookData(payload: any): WebhookPayload;

  /**
   * Generate a unique transaction reference
   * @param prefix - Optional prefix for the transaction reference
   * @returns Unique transaction reference
   */
  generateTransactionRef(prefix?: string): string;
}
