import { BadRequestError } from './AppError.js';

/**
 * Payment Gateway Error
 * Base error class for payment gateway-related errors
 */
export class PaymentGatewayError extends BadRequestError {
  public readonly gatewayType?: string;
  public readonly gatewayResponse?: any;

  constructor(message: string, gatewayType?: string, gatewayResponse?: any) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.gatewayType = gatewayType;
    this.gatewayResponse = gatewayResponse;
  }
}

/**
 * Payment Initialization Error
 * Thrown when payment initialization fails
 */
export class PaymentInitializationError extends PaymentGatewayError {
  constructor(message: string, gatewayType?: string, gatewayResponse?: any) {
    super(message, gatewayType, gatewayResponse);
    this.name = 'PaymentInitializationError';
  }
}

/**
 * Payment Verification Error
 * Thrown when payment verification fails
 */
export class PaymentVerificationError extends PaymentGatewayError {
  public readonly transactionRef?: string;

  constructor(message: string, transactionRef?: string, gatewayType?: string, gatewayResponse?: any) {
    super(message, gatewayType, gatewayResponse);
    this.name = 'PaymentVerificationError';
    this.transactionRef = transactionRef;
  }
}

/**
 * Webhook Verification Error
 * Thrown when webhook signature verification fails
 */
export class WebhookVerificationError extends PaymentGatewayError {
  constructor(message: string, gatewayType?: string) {
    super(message, gatewayType);
    this.name = 'WebhookVerificationError';
  }
}

/**
 * Invalid Gateway Error
 * Thrown when an unsupported or invalid gateway is requested
 */
export class InvalidGatewayError extends BadRequestError {
  public readonly requestedGateway?: string;

  constructor(message: string, requestedGateway?: string) {
    super(message);
    this.name = 'InvalidGatewayError';
    this.requestedGateway = requestedGateway;
  }
}

/**
 * Payment Not Found Error
 * Thrown when a payment record cannot be found
 */
export class PaymentNotFoundError extends BadRequestError {
  public readonly transactionRef?: string;

  constructor(message: string, transactionRef?: string) {
    super(message);
    this.name = 'PaymentNotFoundError';
    this.transactionRef = transactionRef;
  }
}
