import crypto from 'crypto';
import { injectable } from 'inversify';
import { IEncryptedField } from '../../types/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@injectable()
export class FieldEncryptionService {
  private key: Buffer;
  private keyVersion: number;

  constructor() {
    const keyHex = process.env.IDENTITY_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        "IDENTITY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    this.key = Buffer.from(keyHex, 'hex');
    this.keyVersion = parseInt(process.env.IDENTITY_KEY_VERSION || '1', 10);
  }

  encrypt(plaintext: string): IEncryptedField {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyVersion: this.keyVersion,
    };
  }

  decrypt(field: IEncryptedField): string {
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, Buffer.from(field.iv, 'base64'), {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(field.tag, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(field.ciphertext, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
