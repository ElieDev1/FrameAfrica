import { randomInt } from 'node:crypto';

// Unambiguous alphabet — no 0/O/1/l/I — so a temp password read off a screen
// or email can be typed back reliably.
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*?';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)];
}

/**
 * A strong random temporary password. Guarantees at least one character from
 * each class so it always satisfies password policies, then fills to `length`
 * and shuffles. Uses crypto-grade randomness (never Math.random).
 */
export function generateTemporaryPassword(length = 14): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) {
    chars.push(pick(ALL));
  }
  // Fisher–Yates shuffle so the guaranteed classes aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
