import 'reflect-metadata';
import crypto from 'crypto';
import { isSensitiveType, DocumentTypeV2 } from '../../models/TenantDocument.js';

describe('SHA-256 checksum', () => {
  const computeSha256 = (buf: Buffer) => crypto.createHash('sha256').update(buf).digest('hex');

  it('same bytes produce the same hash', () => {
    const buf = Buffer.from('hello world');
    expect(computeSha256(buf)).toBe(computeSha256(buf));
  });

  it('different bytes produce different hashes', () => {
    const a = Buffer.from('hello');
    const b = Buffer.from('world');
    expect(computeSha256(a)).not.toBe(computeSha256(b));
  });

  it('PBT: round-trip stability for 100 random buffers', () => {
    for (let i = 0; i < 100; i++) {
      const len = Math.floor(Math.random() * 1024);
      const buf = crypto.randomBytes(len);
      const h1 = computeSha256(buf);
      const h2 = computeSha256(buf);
      expect(h1).toBe(h2);
      expect(h1).toHaveLength(64);
    }
  });
});

describe('isSensitiveType', () => {
  it('marks identity documents as sensitive', () => {
    const sensitiveTypes: DocumentTypeV2[] = [
      'national_id',
      'passport',
      'proof_of_income',
      'guarantor_id',
      'selfie',
      'power_of_attorney',
    ];
    for (const t of sensitiveTypes) {
      expect(isSensitiveType(t)).toBe(true);
    }
  });

  it('marks non-identity documents as not sensitive', () => {
    const publicTypes: DocumentTypeV2[] = [
      'agreement',
      'proof_of_address',
      'business_registration',
      'lease_amendment',
      'lease_renewal',
      'other',
    ];
    for (const t of publicTypes) {
      expect(isSensitiveType(t)).toBe(false);
    }
  });
});

describe('Document verification status transitions', () => {
  const VALID_DOC_TRANSITIONS: Record<string, string[]> = {
    not_started: ['pending_scan'],
    pending_scan: ['pending', 'scan_failed'],
    scan_failed: [],
    pending: ['in_review'],
    in_review: ['verified', 'rejected'],
    verified: ['expired'],
    rejected: [],
    expired: [],
  };

  const ALL_STATES = Object.keys(VALID_DOC_TRANSITIONS);

  it('all states are reachable from at least one other state except not_started', () => {
    const reachable = new Set<string>();
    for (const from of ALL_STATES) {
      for (const to of VALID_DOC_TRANSITIONS[from]) {
        reachable.add(to);
      }
    }
    for (const state of ALL_STATES) {
      if (state !== 'not_started') {
        expect(reachable.has(state)).toBe(true);
      }
    }
  });

  it('terminal states have no outgoing transitions', () => {
    const terminals = ['scan_failed', 'rejected', 'expired'];
    for (const t of terminals) {
      expect(VALID_DOC_TRANSITIONS[t]).toHaveLength(0);
    }
  });
});

describe('MIME type allowlist', () => {
  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];

  it('allows expected types', () => {
    for (const m of ALLOWED) {
      expect(ALLOWED.includes(m)).toBe(true);
    }
  });

  it('rejects dangerous types', () => {
    const bad = ['text/html', 'application/javascript', 'application/x-executable', 'text/xml'];
    for (const m of bad) {
      expect(ALLOWED.includes(m)).toBe(false);
    }
  });
});
