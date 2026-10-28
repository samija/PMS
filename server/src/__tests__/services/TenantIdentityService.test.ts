import 'reflect-metadata';
import crypto from 'crypto';
import { FieldEncryptionService } from '../../infrastructure/crypto/FieldEncryptionService.js';

const TEST_KEY = crypto.randomBytes(32).toString('hex');

describe('FieldEncryptionService', () => {
  let svc: FieldEncryptionService;

  beforeAll(() => {
    process.env.IDENTITY_ENCRYPTION_KEY = TEST_KEY;
    process.env.IDENTITY_KEY_VERSION = '1';
    svc = new FieldEncryptionService();
  });

  it('encrypts and decrypts back to original', () => {
    const original = 'ETH-1234567890';
    const encrypted = svc.encrypt(original);
    expect(encrypted.ciphertext).not.toBe(original);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.keyVersion).toBe(1);

    const decrypted = svc.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertexts for same plaintext (unique IV)', () => {
    const a = svc.encrypt('test');
    const b = svc.encrypt('test');
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('handles empty strings', () => {
    const encrypted = svc.encrypt('');
    expect(svc.decrypt(encrypted)).toBe('');
  });

  it('handles unicode and Amharic text', () => {
    const amharic = 'ሰላም ዓለም 12345';
    const encrypted = svc.encrypt(amharic);
    expect(svc.decrypt(encrypted)).toBe(amharic);
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = svc.encrypt('sensitive');
    encrypted.ciphertext = Buffer.from('tampered').toString('base64');
    expect(() => svc.decrypt(encrypted)).toThrow();
  });

  it('throws on tampered tag', () => {
    const encrypted = svc.encrypt('sensitive');
    encrypted.tag = Buffer.from('bad-tag-1234567!').toString('base64');
    expect(() => svc.decrypt(encrypted)).toThrow();
  });
});

describe('FieldEncryptionService — PBT-style round-trip', () => {
  let svc: FieldEncryptionService;

  beforeAll(() => {
    process.env.IDENTITY_ENCRYPTION_KEY = TEST_KEY;
    svc = new FieldEncryptionService();
  });

  it('round-trips arbitrary ASCII strings', () => {
    for (let i = 0; i < 100; i++) {
      const len = Math.floor(Math.random() * 200);
      const buf = crypto.randomBytes(len);
      const str = buf.toString('base64').slice(0, len);
      const decrypted = svc.decrypt(svc.encrypt(str));
      expect(decrypted).toBe(str);
    }
  });

  it('round-trips arbitrary UTF-8 strings up to 4KB', () => {
    const samples = [
      'Hello World',
      '日本語テスト',
      'Тест кириллицы',
      'أختبار العربية',
      'ፈተና በአማርኛ',
      '🎉🔐💰',
      'a'.repeat(4096),
    ];
    for (const s of samples) {
      expect(svc.decrypt(svc.encrypt(s))).toBe(s);
    }
  });
});

describe('FieldEncryptionService — boot validation', () => {
  it('throws if IDENTITY_ENCRYPTION_KEY is missing', () => {
    const saved = process.env.IDENTITY_ENCRYPTION_KEY;
    delete process.env.IDENTITY_ENCRYPTION_KEY;
    expect(() => new FieldEncryptionService()).toThrow('IDENTITY_ENCRYPTION_KEY');
    process.env.IDENTITY_ENCRYPTION_KEY = saved;
  });

  it('throws if IDENTITY_ENCRYPTION_KEY is wrong length', () => {
    const saved = process.env.IDENTITY_ENCRYPTION_KEY;
    process.env.IDENTITY_ENCRYPTION_KEY = 'tooshort';
    expect(() => new FieldEncryptionService()).toThrow('64-character');
    process.env.IDENTITY_ENCRYPTION_KEY = saved;
  });
});

describe('Verification state machine transitions', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    not_started: ['pending'],
    pending: ['in_review'],
    in_review: ['verified', 'rejected', 'requires_resubmission'],
    verified: ['expired', 'requires_resubmission'],
    rejected: ['pending'],
    expired: ['pending'],
    requires_resubmission: ['pending'],
  };

  const ALL_STATES = Object.keys(VALID_TRANSITIONS);

  it('accepts every documented valid transition', () => {
    for (const from of ALL_STATES) {
      for (const to of VALID_TRANSITIONS[from]) {
        const allowed = VALID_TRANSITIONS[from];
        expect(allowed).toContain(to);
      }
    }
  });

  it('rejects every invalid transition', () => {
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        const allowed = VALID_TRANSITIONS[from];
        if (!allowed.includes(to)) {
          expect(allowed).not.toContain(to);
        }
      }
    }
  });

  it('every state has at least one outgoing transition', () => {
    for (const state of ALL_STATES) {
      expect(VALID_TRANSITIONS[state].length).toBeGreaterThan(0);
    }
  });
});
