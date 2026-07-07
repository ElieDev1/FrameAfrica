/**
 * Minimal JWT helpers for the BFF. We only read the (unverified) `exp` claim to
 * decide when to refresh — the API remains the source of truth and verifies the
 * signature on every call.
 */

/** Read the `exp` (seconds since epoch) from a JWT, or `null` if unreadable. */
export function readExp(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True if the token is malformed, has no `exp`, or expires within `skewSeconds`. */
export function isTokenExpired(token: string, skewSeconds = 15): boolean {
  const exp = readExp(token);
  if (exp === null) return true;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}
