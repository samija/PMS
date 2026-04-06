import axios from 'axios';
import crypto from 'crypto';
import { BasePaymentGateway } from '../../domain/gateways/BasePaymentGateway.js';
import {
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from '../../domain/interfaces/IPaymentGateway.js';

interface SantimPayInitializePayload {
  id: string;
  amount: number;
  paymentReason: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  notifyUrl: string;
}

interface SantimPayInitializeResponse {
  success: boolean;
  data: {
    checkoutUrl: string;
    transactionId: string;
  };
  message?: string;
}

interface SantimPayVerifyResponse {
  success: boolean;
  data: {
    id: string;
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
    paidAt?: string;
  };
  message?: string;
}

/**
 * Santim Pay Gateway Implementation
 * Integrates with Santim Pay payment aggregator service
 */
export class SantimPayGateway extends BasePaymentGateway {
  private apiKey: string;
  private merchantId: string;
  private apiUrl: string;

  constructor() {
    super('santimpay');
    this.apiKey = process.env.SANTIMPAY_API_KEY || 'test-api-key';
    this.merchantId = process.env.SANTIMPAY_MERCHANT_ID || 'test-merchant';
    this.apiUrl = process.env.SANTIMPAY_API_URL || 'https://api.santimpay.com';
  }

  /**
   * Get SantimPay API headers
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Merchant-ID': this.merchantId,
    };
  }

  /**
   * Initialize payment with SantimPay
   */
  async initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse> {
    this.validatePaymentPayload(payload);

    const santimPayPayload: SantimPayInitializePayload = {
      id: payload.txRef,
      amount: payload.amount,
      paymentReason: payload.customization?.description || 'Payment',
      successRedirectUrl: payload.returnUrl,
      failureRedirectUrl: payload.returnUrl,
      notifyUrl: payload.callbackUrl,
    };

    try {
      const response = await axios.post<SantimPayInitializeResponse>(
        `${this.apiUrl}/v1/checkout/telebirr`,
        santimPayPayload,
        { headers: this.getHeaders() }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'SantimPay payment initialization failed');
      }

      return {
        success: true,
        checkoutUrl: response.data.data.checkoutUrl,
        transactionRef: payload.txRef,
        gatewayReference: response.data.data.transactionId,
        metadata: {
          santimPayMessage: response.data.message,
        },
      };
    } catch (error: any) {
      console.error('SantimPay initialize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize SantimPay payment');
    }
  }

  /**
   * Verify payment with SantimPay
   */
  async verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get<SantimPayVerifyResponse>(
        `${this.apiUrl}/v1/checkout/verify/${transactionRef}`,
        { headers: this.getHeaders() }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      const data = response.data.data;
      const isSuccess = data.status === 'SUCCESS' || data.status === 'COMPLETED';

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : data.status === 'FAILED' ? 'failed' : 'pending',
        transactionRef: data.id,
        gatewayReference: data.transactionId,
        amount: data.amount,
        currency: data.currency || 'ETB',
        paidAt: isSuccess && data.paidAt ? new Date(data.paidAt) : undefined,
        metadata: {
          santimPayStatus: data.status,
        },
      };
    } catch (error: any) {
      console.error('SantimPay verify error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify SantimPay payment');
    }
  }

  /**
   * Verify webhook signature from SantimPay
   */
  async verifyWebhookSignature(payload: any, signature?: string): Promise<boolean> {
    if (!signature) {
      return false;
    }

    try {
      // SantimPay uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.apiKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('SantimPay webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook data from SantimPay
   */
  parseWebhookData(payload: any): WebhookPayload {
    return {
      transactionRef: payload.id || payload.transactionRef,
      status: payload.status,
      gatewayReference: payload.transactionId || payload.gatewayReference,
      amount: payload.amount,
      metadata: {
        currency: payload.currency,
        paidAt: payload.paidAt,
        method: payload.paymentMethod,
      },
    };
  }
}
