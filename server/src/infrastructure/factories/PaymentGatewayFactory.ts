import { IPaymentGateway, PaymentGatewayType } from '../../domain/interfaces/IPaymentGateway.js';
import { ChapaGateway } from '../gateways/ChapaGateway.js';
import { TelebirrGateway } from '../gateways/TelebirrGateway.js';
import { SantimPayGateway } from '../gateways/SantimPayGateway.js';

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances using singleton pattern
 */
export class PaymentGatewayFactory {
  private static instances: Map<PaymentGatewayType, IPaymentGateway> = new Map();

  /**
   * Get a payment gateway instance by type
   * Returns singleton instance for each gateway type
   */
  static getGateway(gatewayType: PaymentGatewayType): IPaymentGateway {
    // Check if instance already exists
    if (this.instances.has(gatewayType)) {
      return this.instances.get(gatewayType)!;
    }

    // Create new instance based on type
    let gateway: IPaymentGateway;

    switch (gatewayType) {
      case 'chapa':
        gateway = new ChapaGateway();
        break;
      case 'telebirr':
        gateway = new TelebirrGateway();
        break;
      case 'santimpay':
        gateway = new SantimPayGateway();
        break;
      default:
        throw new Error(`Unsupported payment gateway type: ${gatewayType}`);
    }

    // Store instance for future use
    this.instances.set(gatewayType, gateway);

    return gateway;
  }

  /**
   * Get the default payment gateway from environment configuration
   * Falls back to 'chapa' if not configured
   */
  static getDefaultGateway(): IPaymentGateway {
    const defaultGatewayType = (process.env.DEFAULT_PAYMENT_GATEWAY as PaymentGatewayType) || 'chapa';

    // Validate that the default gateway type is supported
    if (!['chapa', 'telebirr', 'santimpay'].includes(defaultGatewayType)) {
      console.warn(`Invalid default gateway type: ${defaultGatewayType}, falling back to 'chapa'`);
      return this.getGateway('chapa');
    }

    return this.getGateway(defaultGatewayType);
  }

  /**
   * Get the default gateway type from environment
   */
  static getDefaultGatewayType(): PaymentGatewayType {
    const defaultGatewayType = (process.env.DEFAULT_PAYMENT_GATEWAY as PaymentGatewayType) || 'chapa';

    if (!['chapa', 'telebirr', 'santimpay'].includes(defaultGatewayType)) {
      return 'chapa';
    }

    return defaultGatewayType;
  }

  /**
   * Get list of all available payment gateway types
   * Can be filtered by environment configuration in the future
   */
  static getAvailableGateways(): PaymentGatewayType[] {
    // In the future, this could check for configured API keys
    // and only return gateways that have valid credentials
    return ['chapa', 'telebirr', 'santimpay'];
  }

  /**
   * Check if a gateway type is supported
   */
  static isGatewaySupported(gatewayType: string): boolean {
    return ['chapa', 'telebirr', 'santimpay'].includes(gatewayType);
  }

  /**
   * Clear all cached gateway instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}
