import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger.js';

/**
 * Middleware to verify Chapa webhook HMAC-SHA256 signatures.
 *
 * Chapa sends a hash of the request body in the `x-chapa-signature` header
 * (also checked under `chapa-signature` for compatibility). The hash is
 * computed as HMAC-SHA256(secret, rawBody).
 *
 * NOTE: This implementation follows the standard HMAC-SHA256 pattern.
 * Verify the exact header name and hashing scheme against Chapa's latest
 * documentation, as their API may evolve.
 *
 * IMPORTANT: For this middleware to work, the raw request body must be
 * available on `req.rawBody`. This is typically set up via a `verify`
 * callback on `express.json()` in the main app setup. If `rawBody` is not
 * available, the middleware falls back to JSON.stringify(req.body), but
 * this may produce a different byte sequence than the original payload
 * and cause false rejections.
 */

// Extend Express Request to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export function verifyChapaWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.CHAPA_SECRET_KEY;

  if (!secret) {
    logger.error('CHAPA_SECRET_KEY is not configured. Rejecting webhook request.');
    res.status(500).json({ success: false, message: 'Webhook verification not configured' });
    return;
  }

  const signature =
    (req.headers['x-chapa-signature'] as string) ||
    (req.headers['chapa-signature'] as string);

  if (!signature) {
    res.status(401).json({ success: false, message: 'Missing webhook signature' });
    return;
  }

  // Use raw body if available; fall back to JSON.stringify
  const payload = req.rawBody
    ? req.rawBody
    : Buffer.from(JSON.stringify(req.body));

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  next();
}
