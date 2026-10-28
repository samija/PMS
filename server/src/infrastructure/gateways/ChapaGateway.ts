import axios from 'axios';
import { BasePaymentGateway } from '../../domain/gateways/BasePaymentGateway.js';
import { logger } from '../../config/logger.js';
import {
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from '../../domain/interfaces/IPaymentGateway.js';

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

interface ChapaInitializePayload {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Chapa Payment Gateway Implementation
 * Integrates with Chapa payment service
 */
export class ChapaGateway extends BasePaymentGateway {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    super('chapa');
    this.secretKey = process.env.CHAPA_SECRET_KEY || '';
    this.baseUrl = CHAPA_BASE_URL;
  }

  /**
   * Get Chapa API headers
   */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize payment with Chapa
   */
  async initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse> {
    this.validatePaymentPayload(payload);

    const chapaPayload: ChapaInitializePayload = {
      amount: payload.amount,
      currency: payload.currency,
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      tx_ref: payload.txRef,
      callback_url: payload.callbackUrl,
      return_url: payload.returnUrl,
      customization: payload.customization,
    };

    try {
      const response = await axios.post<ChapaInitializeResponse>(
        `${this.baseUrl}/transaction/initialize`,
        chapaPayload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        checkoutUrl: response.data.data.checkout_url,
        transactionRef: payload.txRef,
        metadata: {
          chapaMessage: response.data.message,
          chapaStatus: response.data.status,
        },
      };
    } catch (error: any) {
      logger.error('Chapa initialize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize Chapa payment');
    }
  }

  /**
   * Verify payment with Chapa
   */
  async verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get<ChapaVerifyResponse>(
        `${this.baseUrl}/transaction/verify/${transactionRef}`,
        { headers: this.getHeaders() }
      );

      const isSuccess = response.data.status === 'success';

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'failed',
        transactionRef: response.data.data.tx_ref,
        gatewayReference: response.data.data.reference,
        amount: response.data.data.amount,
        currency: response.data.data.currency,
        paidAt: isSuccess ? new Date(response.data.data.updated_at) : undefined,
        metadata: {
          charge: response.data.data.charge,
          mode: response.data.data.mode,
          method: response.data.data.method,
        },
      };
    } catch (error: any) {
      logger.error('Chapa verify error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify Chapa payment');
    }
  }

  /**
   * Verify webhook signature
   * Note: Chapa doesn't currently support webhook signature verification
   */
  async verifyWebhookSignature(payload: any, signature?: string): Promise<boolean> {
    // Chapa doesn't provide webhook signature verification
    // In production, consider IP whitelisting or other security measures
    return true;
  }

  /**
   * Parse webhook data from Chapa
   */
  parseWebhookData(payload: any): WebhookPayload {
    return {
      transactionRef: payload.tx_ref || payload.trx_ref,
      status: payload.status,
      gatewayReference: payload.reference,
      amount: payload.amount,
      metadata: {
        currency: payload.currency,
        charge: payload.charge,
        method: payload.method,
      },
    };
  }
}
