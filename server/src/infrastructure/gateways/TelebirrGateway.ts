import axios from 'axios';
import crypto from 'crypto';
import { BasePaymentGateway } from '../../domain/gateways/BasePaymentGateway.js';
import {
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from '../../domain/interfaces/IPaymentGateway.js';

interface TelebirrInitializePayload {
  appId: string;
  appKey: string;
  nonce: string;
  notifyUrl: string;
  outTradeNo: string;
  returnUrl: string;
  shortCode: string;
  subject: string;
  timestamp: string;
  totalAmount: string;
  sign: string;
}

interface TelebirrInitializeResponse {
  code: number;
  msg: string;
  data: {
    toPayUrl: string;
    tradeNo?: string;
  };
}

interface TelebirrVerifyResponse {
  code: number;
  msg: string;
  data: {
    outTradeNo: string;
    tradeNo: string;
    tradeStatus: string;
    totalAmount: string;
    transactionNo: string;
  };
}

/**
 * Telebirr Payment Gateway Implementation
 * Integrates with Telebirr H5 Web payment service
 */
export class TelebirrGateway extends BasePaymentGateway {
  private appId: string;
  private appKey: string;
  private shortCode: string;
  private apiUrl: string;

  constructor() {
    super('telebirr');
    this.appId = process.env.TELEBIRR_APP_ID || 'test-app-id';
    this.appKey = process.env.TELEBIRR_APP_KEY || 'test-app-key';
    this.shortCode = process.env.TELEBIRR_SHORT_CODE || '000000';
    this.apiUrl = process.env.TELEBIRR_API_URL || 'https://test-api.telebirr.com';
  }

  /**
   * Generate SHA-256 signature for Telebirr request
   */
  private generateSignature(params: Record<string, string>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Build signature string: key1=value1&key2=value2...
    const signString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Append app key
    const signStringWithKey = `${signString}&key=${this.appKey}`;

    // Generate SHA-256 hash
    return crypto
      .createHash('sha256')
      .update(signStringWithKey)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Generate nonce (random string)
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Initialize payment with Telebirr
   */
  async initializePayment(payload: PaymentInitializationPayload): Promise<PaymentInitializationResponse> {
    this.validatePaymentPayload(payload);

    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();

    // Build parameters for signature (excluding sign field)
    const signParams: Record<string, string> = {
      appId: this.appId,
      nonce: nonce,
      notifyUrl: payload.callbackUrl,
      outTradeNo: payload.txRef,
      returnUrl: payload.returnUrl,
      shortCode: this.shortCode,
      subject: payload.customization?.title || 'Payment',
      timestamp: timestamp,
      totalAmount: payload.amount.toFixed(2),
    };

    // Generate signature
    const signature = this.generateSignature(signParams);

    // Build full request payload
    const telebirrPayload: TelebirrInitializePayload = {
      ...signParams,
      appKey: this.appKey,
      sign: signature,
    };

    try {
      const response = await axios.post<TelebirrInitializeResponse>(
        `${this.apiUrl}/payment/v1/h5/pay`,
        telebirrPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || 'Telebirr payment initialization failed');
      }

      return {
        success: true,
        checkoutUrl: response.data.data.toPayUrl,
        transactionRef: payload.txRef,
        gatewayReference: response.data.data.tradeNo,
        metadata: {
          telebirrCode: response.data.code,
          telebirrMessage: response.data.msg,
        },
      };
    } catch (error: any) {
      console.error('Telebirr initialize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to initialize Telebirr payment');
    }
  }

  /**
   * Verify payment with Telebirr
   */
  async verifyPayment(transactionRef: string): Promise<PaymentVerificationResponse> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();

    // Build parameters for signature
    const signParams: Record<string, string> = {
      appId: this.appId,
      nonce: nonce,
      outTradeNo: transactionRef,
      timestamp: timestamp,
    };

    // Generate signature
    const signature = this.generateSignature(signParams);

    try {
      const response = await axios.post<TelebirrVerifyResponse>(
        `${this.apiUrl}/payment/v1/query`,
        {
          ...signParams,
          appKey: this.appKey,
          sign: signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || 'Payment verification failed');
      }

      const data = response.data.data;
      const isSuccess = data.tradeStatus === 'SUCCESS';

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : data.tradeStatus === 'FAILED' ? 'failed' : 'pending',
        transactionRef: data.outTradeNo,
        gatewayReference: data.tradeNo,
        amount: parseFloat(data.totalAmount),
        currency: 'ETB',
        paidAt: isSuccess ? new Date() : undefined,
        metadata: {
          transactionNo: data.transactionNo,
          tradeStatus: data.tradeStatus,
        },
      };
    } catch (error: any) {
      console.error('Telebirr verify error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to verify Telebirr payment');
    }
  }

  /**
   * Verify webhook signature from Telebirr
   */
  async verifyWebhookSignature(payload: any, signature?: string): Promise<boolean> {
    if (!signature) {
      return false;
    }

    try {
      // Extract signature parameters from webhook payload
      const { sign, ...params } = payload;

      // Generate expected signature
      const expectedSignature = this.generateSignature(params);

      // Compare signatures
      return expectedSignature === signature || expectedSignature === sign;
    } catch (error) {
      console.error('Telebirr webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook data from Telebirr
   */
  parseWebhookData(payload: any): WebhookPayload {
    return {
      transactionRef: payload.outTradeNo,
      status: payload.tradeStatus || payload.status,
      gatewayReference: payload.tradeNo,
      amount: payload.totalAmount ? parseFloat(payload.totalAmount) : undefined,
      metadata: {
        transactionNo: payload.transactionNo,
        timestamp: payload.timestamp,
      },
    };
  }
}
