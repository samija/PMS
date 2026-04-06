# Payment Gateway Integration Guide

This document provides comprehensive information about the multi-gateway payment integration implemented in Enderase.

## Overview

Enderase now supports multiple payment gateways:
- **Chapa** - Ethiopian payment gateway (existing)
- **Telebirr** - Ethio Telecom mobile money service (new)
- **Santim Pay** - Payment aggregator supporting multiple methods (new)

## Architecture

The integration uses a **Gateway Abstraction Pattern** with the following structure:

```
PaymentService
    ↓
PaymentGatewayFactory
    ↓
IPaymentGateway Interface
    ├── ChapaGateway
    ├── TelebirrGateway
    └── SantimPayGateway
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Payment Gateway Selection
DEFAULT_PAYMENT_GATEWAY=chapa

# Chapa (existing)
CHAPA_SECRET_KEY=your-chapa-secret-key
CHAPA_PUBLIC_KEY=your-chapa-public-key

# Telebirr
TELEBIRR_API_URL=https://test-api.telebirr.com
TELEBIRR_APP_ID=your-app-id
TELEBIRR_APP_KEY=your-app-key
TELEBIRR_SHORT_CODE=your-short-code

# Santim Pay
SANTIMPAY_API_URL=https://api.santimpay.com
SANTIMPAY_API_KEY=your-api-key
SANTIMPAY_MERCHANT_ID=your-merchant-id

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### Test Mode

For testing without real credentials, use the placeholder values from `.env.example`. These will not process real payments but allow you to test the integration flow.

## API Usage

### 1. Get Available Gateways

```bash
GET /api/payments/gateways
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gateways": ["chapa", "telebirr", "santimpay"],
    "default": "chapa"
  }
}
```

### 2. Initialize Payment

```bash
POST /api/payments/initialize
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenantId": "507f1f77bcf86cd799439011",
  "amount": 5000,
  "type": "rent",
  "month": 2,
  "year": 2026,
  "gateway": "telebirr"  // Optional - defaults to DEFAULT_PAYMENT_GATEWAY
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "payment": {
      "_id": "...",
      "amount": 5000,
      "paymentMethod": "telebirr",
      "gatewayTransactionRef": "PMS-1234567890-ABC123",
      "status": "pending"
    },
    "checkoutUrl": "https://telebirr.com/checkout/..."
  }
}
```

### 3. Verify Payment

```bash
GET /api/payments/verify/:txRef
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "...",
    "status": "completed",
    "gatewayReference": "TBR-12345",
    "paidAt": "2026-02-05T10:30:00.000Z",
    "receipt": {
      "number": "RCP-1234567890-ABCD",
      "generatedAt": "2026-02-05T10:30:00.000Z"
    }
  }
}
```

### 4. Webhook Endpoints

Each gateway has its own webhook endpoint:

- **Chapa:** `POST /api/payments/webhook/chapa`
- **Telebirr:** `POST /api/payments/webhook/telebirr`
- **Santim Pay:** `POST /api/payments/webhook/santimpay`

Legacy endpoint (routes to Chapa): `POST /api/payments/webhook`

## Gateway-Specific Details

### Chapa

**Features:**
- Mobile money (Telebirr, M-Pesa, etc.)
- Bank cards
- Bank transfers

**Webhook:** No signature verification (use IP whitelisting in production)

**Documentation:** https://developer.chapa.co/docs

### Telebirr

**Features:**
- Mobile money via Telebirr app
- H5 Web payment integration
- SHA-256 signature verification

**Webhook Signature Header:** `X-Telebirr-Signature`

**Test Mode:** Use `TELEBIRR_APP_ID=test-app-id` for testing

**Production Setup:**
1. Contact Ethio Telecom: https://www.ethiotelecom.et/telebirr/
2. Apply for merchant account
3. Receive production credentials (appId, appKey, shortCode)

### Santim Pay

**Features:**
- Payment aggregator
- Supports Telebirr, CBE Birr, and bank transfers
- Simpler API than direct Telebirr integration

**Webhook Signature Header:** `X-SantimPay-Signature`

**Test Mode:** Use `SANTIMPAY_API_KEY=test-api-key` for testing

**Production Setup:**
1. Contact Santim Pay: info@santimpay.com
2. Request API credentials
3. Receive production API key and merchant ID

## Database Schema

The Payment model now includes:

```typescript
{
  // Generic gateway fields (new)
  paymentMethod: 'chapa' | 'telebirr' | 'santimpay' | 'manual',
  gatewayReference: string,
  gatewayTransactionRef: string,
  gatewayMetadata: object,

  // Legacy Chapa fields (backward compatibility)
  chapaReference: string,
  chapaTxRef: string,

  // Other fields...
}
```

## Backward Compatibility

✅ **All existing Chapa payments continue to work**
- Old payments use `chapaTxRef` field
- New payments use `gatewayTransactionRef` field
- Queries check both fields: `$or: [{ gatewayTransactionRef }, { chapaTxRef }]`
- Legacy webhook endpoint `/api/payments/webhook` still works

## Error Handling

The system includes comprehensive error handling:

```typescript
// Payment-specific errors
- PaymentGatewayError
- PaymentInitializationError
- PaymentVerificationError
- WebhookVerificationError
- InvalidGatewayError
- PaymentNotFoundError
```

All errors include gateway type and relevant context for debugging.

## Logging

Payment operations are logged using the `paymentLogger` utility:

```typescript
// Log types
- logInitialization()
- logInitializationSuccess()
- logInitializationFailure()
- logVerification()
- logVerificationSuccess()
- logVerificationFailure()
- logWebhook()
- logWebhookSignatureFailure()
- logWebhookSuccess()
- logWebhookFailure()
```

## Testing

### Unit Tests

Test individual gateway implementations:

```typescript
import { MockGateway } from './infrastructure/gateways/MockGateway';

const gateway = new MockGateway();
const result = await gateway.initializePayment(payload);
```

### Integration Tests

Test the full payment flow with test credentials.

### Manual Testing

1. Start the server with test credentials
2. Call `GET /api/payments/gateways` to verify available gateways
3. Initialize payment with `gateway` parameter
4. Check the response includes correct checkout URL format
5. Simulate webhook calls to each endpoint

## Security Considerations

### Production Checklist

- [ ] Replace all test credentials with production credentials
- [ ] Enable webhook signature verification for all gateways
- [ ] Implement IP whitelisting for webhook endpoints
- [ ] Use HTTPS for all payment callbacks
- [ ] Set up rate limiting on payment endpoints
- [ ] Monitor payment logs for suspicious activity
- [ ] Implement idempotency checks for duplicate payments
- [ ] Store sensitive data encrypted at rest
- [ ] Regular security audits

### Webhook Security

```typescript
// Webhook signature verification is implemented for:
✅ Telebirr - SHA-256 signature
✅ Santim Pay - HMAC-SHA256 signature
⚠️  Chapa - No signature (use IP whitelisting)
```

## Adding New Gateways

To add a new payment gateway:

1. Create gateway class implementing `IPaymentGateway`:
   ```typescript
   export class NewGateway extends BasePaymentGateway {
     // Implement required methods
   }
   ```

2. Update `PaymentGatewayType` in `IPaymentGateway.ts`:
   ```typescript
   export type PaymentGatewayType = 'chapa' | 'telebirr' | 'santimpay' | 'newgateway';
   ```

3. Add to `PaymentGatewayFactory.ts`:
   ```typescript
   case 'newgateway':
     gateway = new NewGateway();
     break;
   ```

4. Add webhook route in `paymentRoutes.ts`

5. Update `.env.example` with new credentials

## Troubleshooting

### Payment initialization fails

- Check gateway credentials in `.env`
- Verify API URLs are correct
- Check network connectivity
- Review payment logs for specific errors

### Webhook not received

- Verify webhook URL is publicly accessible
- Check firewall settings
- Ensure webhook endpoint is registered with gateway
- Review webhook logs

### Signature verification fails

- Check API keys match between `.env` and gateway dashboard
- Verify payload is not modified
- Check signature header name is correct

## Support

For issues related to:
- **Chapa:** developer@chapa.co
- **Telebirr:** Ethio Telecom customer service
- **Santim Pay:** info@santimpay.com
- **Enderase Integration:** Create an issue in the repository

## References

- [Chapa API Documentation](https://developer.chapa.co/docs)
- [Telebirr H5 Web Integration Guide](https://www.etdemy.com/course/details/1/telebirr-h5-web-payment-integration)
- [Santim Pay Documentation](https://santimpay.com/docs)
- [Payment Gateway Integration Best Practices](https://stripe.com/docs/payments/payment-intents)
