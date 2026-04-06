import axios from 'axios';
import logger from './logger.js';

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export interface ChapaInitializePayload {
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

export interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
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

class ChapaService {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(payload: ChapaInitializePayload): Promise<ChapaInitializeResponse> {
    try {
      const response = await axios.post<ChapaInitializeResponse>(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        payload,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Chapa initialize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  }

  async verifyPayment(txRef: string): Promise<ChapaVerifyResponse> {
    try {
      const response = await axios.get<ChapaVerifyResponse>(
        `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Chapa verify error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  generateTxRef(prefix: string = 'ENDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const chapaService = new ChapaService();
export default chapaService;
