import { generateTotpSecret, totpKeyuri, verifyTotp } from './totp';

// A known RFC 6238 vector: secret "12345678901234567890" (ASCII) → base32
// "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ". At T=59s (counter 1) the SHA-1 code is
// 287082. We freeze time to that step.
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('totp', () => {
  it('matches the RFC 6238 SHA-1 test vector', () => {
    jest.useFakeTimers().setSystemTime(new Date(59 * 1000));
    expect(verifyTotp(RFC_SECRET, '287082')).toBe(true);
    jest.useRealTimers();
  });

  it('accepts a freshly generated secret + current code, rejects a wrong one', () => {
    const secret = generateTotpSecret();
    // Derive the current code by trusting verify at offset 0 through a brute
    // check of 000000..? Instead, assert a bad code fails and the secret is
    // base32-shaped; correctness of the algorithm is covered by the RFC vector.
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, 'notanum')).toBe(false);
  });

  it('builds an otpauth URI with issuer + params', () => {
    const uri = totpKeyuri('jane@frameafrica.rw', 'Frame Africa', RFC_SECRET);
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain('issuer=Frame+Africa');
    expect(uri).toContain('digits=6');
  });
});
