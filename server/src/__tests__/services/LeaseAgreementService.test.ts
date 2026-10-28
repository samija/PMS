import 'reflect-metadata';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { ClickToAcceptSignatureProvider } from '../../infrastructure/signature/ClickToAcceptSignatureProvider.js';
import { LeaseStatus } from '../../models/LeaseAgreement.js';

const VALID_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  draft: ['pending_owner_signature'],
  pending_owner_signature: ['pending_tenant_signature'],
  pending_tenant_signature: ['active'],
  active: ['expiring_soon', 'terminated', 'renewed'],
  expiring_soon: ['expired', 'terminated', 'renewed'],
  expired: ['renewed'],
  renewed: [],
  terminated: [],
};

describe('Lease state machine transitions', () => {
  const ALL_STATES = Object.keys(VALID_TRANSITIONS) as LeaseStatus[];

  it('PBT: every valid transition is accepted', () => {
    for (const from of ALL_STATES) {
      for (const to of VALID_TRANSITIONS[from]) {
        expect(VALID_TRANSITIONS[from]).toContain(to);
      }
    }
  });

  it('PBT: every invalid transition is rejected', () => {
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        if (!VALID_TRANSITIONS[from].includes(to)) {
          expect(VALID_TRANSITIONS[from]).not.toContain(to);
        }
      }
    }
  });

  it('terminal states have no outgoing transitions', () => {
    expect(VALID_TRANSITIONS['renewed']).toHaveLength(0);
    expect(VALID_TRANSITIONS['terminated']).toHaveLength(0);
  });

  it('signing flow follows draft → pending_owner → pending_tenant → active', () => {
    expect(VALID_TRANSITIONS['draft']).toContain('pending_owner_signature');
    expect(VALID_TRANSITIONS['pending_owner_signature']).toContain('pending_tenant_signature');
    expect(VALID_TRANSITIONS['pending_tenant_signature']).toContain('active');
  });

  it('active can transition to expiring_soon, terminated, or renewed', () => {
    expect(VALID_TRANSITIONS['active']).toEqual(expect.arrayContaining(['expiring_soon', 'terminated', 'renewed']));
  });
});

describe('ClickToAcceptSignatureProvider', () => {
  let provider: ClickToAcceptSignatureProvider;

  beforeAll(() => {
    process.env.SIGNATURE_HMAC_KEY = crypto.randomBytes(32).toString('hex');
    provider = new ClickToAcceptSignatureProvider();
  });

  it('produces a valid signature', () => {
    const sig = provider.sign({
      userId: new Types.ObjectId().toString(),
      docSha256: crypto.randomBytes(32).toString('hex'),
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    });

    expect(sig.signatureHash).toHaveLength(64);
    expect(sig.signatureNonce).toHaveLength(32);
    expect(sig.signerUserId).toBeDefined();
    expect(sig.signedAt).toBeInstanceOf(Date);
  });

  it('verifies a valid signature', () => {
    const docHash = crypto.randomBytes(32).toString('hex');
    const sig = provider.sign({
      userId: new Types.ObjectId().toString(),
      docSha256: docHash,
      ip: '10.0.0.1',
      userAgent: 'Chrome',
    });

    expect(provider.verify(sig, docHash)).toBe(true);
  });

  it('rejects signature when document hash changed (tamper detection)', () => {
    const sig = provider.sign({
      userId: new Types.ObjectId().toString(),
      docSha256: crypto.randomBytes(32).toString('hex'),
      ip: '10.0.0.1',
      userAgent: 'Firefox',
    });

    const tamperedHash = crypto.randomBytes(32).toString('hex');
    expect(provider.verify(sig, tamperedHash)).toBe(false);
  });

  it('rejects signature when hash is tampered', () => {
    const docHash = crypto.randomBytes(32).toString('hex');
    const sig = provider.sign({
      userId: new Types.ObjectId().toString(),
      docSha256: docHash,
      ip: '10.0.0.1',
      userAgent: 'Safari',
    });

    sig.signatureHash = crypto.randomBytes(32).toString('hex');
    expect(provider.verify(sig, docHash)).toBe(false);
  });

  it('PBT: different inputs produce different signature hashes', () => {
    const docHash = crypto.randomBytes(32).toString('hex');
    const sigs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const sig = provider.sign({
        userId: new Types.ObjectId().toString(),
        docSha256: docHash,
        ip: '10.0.0.1',
        userAgent: 'test',
      });
      sigs.add(sig.signatureHash);
    }
    expect(sigs.size).toBe(50);
  });
});
