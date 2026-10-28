import 'reflect-metadata';

describe('Audit redaction', () => {
  const SENSITIVE_KEYS = ['nationalIdNumber', 'passportNumber', 'incomeAmount', 'signatureHash', 'signatureNonce'];

  const redact = (obj?: Record<string, any>) => {
    if (!obj) return obj;
    const clone = { ...obj };
    for (const key of SENSITIVE_KEYS) {
      if (clone[key] !== undefined) clone[key] = '[REDACTED]';
    }
    return clone;
  };

  it('redacts all sensitive fields', () => {
    const input = {
      nationalIdNumber: { ciphertext: 'abc' },
      passportNumber: { ciphertext: 'def' },
      incomeAmount: { ciphertext: 'ghi' },
      signatureHash: 'abcdef123456',
      signatureNonce: 'nonce123',
      name: 'Daniel Hailu',
      status: 'active',
    };
    const result = redact(input);
    expect(result!.nationalIdNumber).toBe('[REDACTED]');
    expect(result!.passportNumber).toBe('[REDACTED]');
    expect(result!.incomeAmount).toBe('[REDACTED]');
    expect(result!.signatureHash).toBe('[REDACTED]');
    expect(result!.signatureNonce).toBe('[REDACTED]');
    expect(result!.name).toBe('Daniel Hailu');
    expect(result!.status).toBe('active');
  });

  it('leaves non-sensitive objects unchanged', () => {
    const input = { name: 'Test', type: 'national_id', version: 2 };
    expect(redact(input)).toEqual(input);
  });

  it('handles undefined input', () => {
    expect(redact(undefined)).toBeUndefined();
  });

  it('PBT: never leaks sensitive values through', () => {
    for (let i = 0; i < 50; i++) {
      const payload: Record<string, any> = {};
      for (const key of SENSITIVE_KEYS) {
        if (Math.random() > 0.5) {
          payload[key] = `secret_${i}_${key}`;
        }
      }
      payload[`safe_${i}`] = `value_${i}`;
      const result = redact(payload)!;
      for (const key of SENSITIVE_KEYS) {
        if (result[key] !== undefined) {
          expect(result[key]).toBe('[REDACTED]');
        }
      }
    }
  });
});
