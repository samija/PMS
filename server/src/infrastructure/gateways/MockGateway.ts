import { BasePaymentGateway } from '../../domain/gateways/BasePaymentGateway.js';
import {
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from '../../domain/interfaces/IPaymentGateway.js';

/**
 * Mock Payment Gateway
 * Used for testing purposes - always succeeds
 */
export class MockGateway extends BasePaymentGateway {
  private shouldFail: boolean;

  constructor(shouldFail: boolean = false) {
    super('chapa'); // Use 'chapa' as the type for mock
    this.shouldFail = shouldFail;
  }

  /**
   * Set whether the gateway should fail operations
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Initialize payment (mock implementation)
   */
  async initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse> {
    this.validatePaymentPayload(payload);

    if (this.shouldFail) {
      throw new Error('Mock gateway: Payment initialization failed');
    }

    return {
      success: true,
      checkoutUrl: `https://mock-checkout.test/pay/${payload.txRef}`,
      transactionRef: payload.txRef,
      gatewayReference: `MOCK-${Date.now()}`,
      metadata: {
        mock: true,
        testMode: true,
      },
    };
  }

  /**
   * Verify payment (mock implementation)
   */
  async verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse> {
    if (this.shouldFail) {
      return {
        success: false,
        status: 'failed',
        transactionRef,
        gatewayReference: `MOCK-${Date.now()}`,
        amount: 0,
        currency: 'ETB',
      };
    }

    return {
      success: true,
      status: 'success',
      transactionRef,
      gatewayReference: `MOCK-${Date.now()}`,
      amount: 1000,
      currency: 'ETB',
      paidAt: new Date(),
      metadata: {
        mock: true,
        testMode: true,
      },
    };
  }

  /**
   * Verify webhook signature (mock implementation)
   */
  async verifyWebhookSignature(payload: any, signature?: string): Promise<boolean> {
    // Mock always returns true unless configured to fail
    return !this.shouldFail;
  }

  /**
   * Parse webhook data (mock implementation)
   */
  parseWebhookData(payload: any): WebhookPayload {
    return {
      transactionRef: payload.tx_ref || payload.transactionRef,
      status: payload.status || 'success',
      gatewayReference: payload.reference || `MOCK-${Date.now()}`,
      amount: payload.amount || 1000,
      metadata: {
        mock: true,
        testMode: true,
      },
    };
  }
}
