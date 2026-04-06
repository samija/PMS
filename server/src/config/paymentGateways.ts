import { PaymentGatewayType } from '../domain/interfaces/IPaymentGateway.js';

/**
 * Payment Gateway Configuration
 * Central configuration for all payment gateway settings
 */

export interface GatewayConfig {
  type: PaymentGatewayType;
  enabled: boolean;
  testMode: boolean;
  name: string;
  description: string;
}

/**
 * Get configuration for all payment gateways
 */
export function getPaymentGatewaysConfig(): GatewayConfig[] {
  return [
    {
      type: 'chapa',
      enabled: !!process.env.CHAPA_SECRET_KEY,
      testMode: !process.env.CHAPA_SECRET_KEY || process.env.CHAPA_SECRET_KEY.includes('test'),
      name: 'Chapa',
      description: 'Ethiopian payment gateway supporting mobile money, bank cards, and more',
    },
    {
      type: 'telebirr',
      enabled: !!process.env.TELEBIRR_APP_ID,
      testMode: !process.env.TELEBIRR_APP_ID || process.env.TELEBIRR_APP_ID === 'test-app-id',
      name: 'Telebirr',
      description: 'Ethio Telecom mobile money payment service',
    },
    {
      type: 'santimpay',
      enabled: !!process.env.SANTIMPAY_API_KEY,
      testMode: !process.env.SANTIMPAY_API_KEY || process.env.SANTIMPAY_API_KEY === 'test-api-key',
      name: 'Santim Pay',
      description: 'Payment aggregator supporting Telebirr, CBE Birr, and bank transfers',
    },
  ];
}

/**
 * Get configuration for a specific gateway
 */
export function getGatewayConfig(gatewayType: PaymentGatewayType): GatewayConfig | undefined {
  return getPaymentGatewaysConfig().find(config => config.type === gatewayType);
}

/**
 * Get all enabled gateways
 */
export function getEnabledGateways(): GatewayConfig[] {
  return getPaymentGatewaysConfig().filter(config => config.enabled);
}

/**
 * Check if a gateway is in test mode
 */
export function isGatewayInTestMode(gatewayType: PaymentGatewayType): boolean {
  const config = getGatewayConfig(gatewayType);
  return config ? config.testMode : true;
}

/**
 * Get default gateway type from environment
 */
export function getDefaultGatewayType(): PaymentGatewayType {
  const defaultGateway = process.env.DEFAULT_PAYMENT_GATEWAY as PaymentGatewayType;

  // Validate that it's a supported gateway type
  if (['chapa', 'telebirr', 'santimpay'].includes(defaultGateway)) {
    return defaultGateway;
  }

  // Default to Chapa
  return 'chapa';
}
