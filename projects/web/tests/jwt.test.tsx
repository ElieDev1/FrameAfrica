import { isTokenExpired, readExp } from '@/lib/jwt';

function makeToken(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${b64}.signature`;
}

const nowSec = () => Math.floor(Date.now() / 1000);

describe('jwt', () => {
  it('reads the exp claim', () => {
    expect(readExp(makeToken({ exp: 123, sub: 'u1' }))).toBe(123);
  });

  it('returns null for a malformed token', () => {
    expect(readExp('not-a-jwt')).toBeNull();
  });

  it('treats a token expiring in an hour as valid', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec() + 3600 }))).toBe(false);
  });

  it('treats an already-expired token as expired', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec() - 30 }))).toBe(true);
  });

  it('treats a token within the skew window as expired', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec() + 5 }), 15)).toBe(true);
  });

  it('treats a token without exp or a malformed token as expired', () => {
    expect(isTokenExpired(makeToken({ sub: 'u1' }))).toBe(true);
    expect(isTokenExpired('garbage')).toBe(true);
  });
});
