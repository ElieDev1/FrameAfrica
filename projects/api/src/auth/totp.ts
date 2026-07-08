import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Minimal RFC 6238 TOTP (SHA-1, 6 digits, 30s step) with RFC 4648 base32,
 * matching Google Authenticator / Authy defaults. Implemented directly on Node
 * crypto to avoid a heavy OTP dependency.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DIGITS = 6;
const STEP_SECONDS = 30;

/** A fresh base32 secret (default 20 bytes / 160 bits, per RFC 4226). */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/** The otpauth:// provisioning URI an authenticator app scans. */
export function totpKeyuri(accountName: string, issuer: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Verify a code against the secret, allowing ±1 step for clock drift. */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const cleaned = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const key = base32Decode(secret);
  if (key.length === 0) return false;

  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let offset = -window; offset <= window; offset++) {
    const expected = hotp(key, counter + offset);
    if (timingSafeEqualStr(expected, cleaned)) return true;
  }
  return false;
}

/** HOTP value (RFC 4226) for a given counter, zero-padded to DIGITS. */
function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // Big-endian 64-bit counter (safe for the ~centuries this app will run).
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) return Buffer.alloc(0); // invalid secret
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
