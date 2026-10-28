import { injectable } from 'inversify';
import crypto from 'crypto';
import { ISignature } from '../../models/LeaseAgreement.js';
import { Types } from 'mongoose';

@injectable()
export class ClickToAcceptSignatureProvider {
  private hmacKey: string;

  constructor() {
    this.hmacKey = process.env.SIGNATURE_HMAC_KEY || process.env.JWT_SECRET || '';
    if (!this.hmacKey) {
      throw new Error('SIGNATURE_HMAC_KEY or JWT_SECRET is required for lease signing');
    }
  }

  sign(input: { userId: string; docSha256: string; ip: string; userAgent: string }): ISignature {
    const nonce = crypto.randomBytes(16).toString('hex');
    const canonical = `${input.userId}|${input.docSha256}|${nonce}`;
    const hash = crypto.createHmac('sha256', this.hmacKey).update(canonical).digest('hex');

    return {
      signerUserId: new Types.ObjectId(input.userId),
      signedAt: new Date(),
      ipAddress: input.ip,
      userAgent: input.userAgent.slice(0, 500),
      documentSha256AtSigning: input.docSha256,
      signatureNonce: nonce,
      signatureHash: hash,
    };
  }

  verify(sig: ISignature, docSha256: string): boolean {
    if (sig.documentSha256AtSigning !== docSha256) return false;
    const canonical = `${sig.signerUserId.toString()}|${sig.documentSha256AtSigning}|${sig.signatureNonce}`;
    const expected = crypto.createHmac('sha256', this.hmacKey).update(canonical).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig.signatureHash, 'hex'), Buffer.from(expected, 'hex'));
  }
}
