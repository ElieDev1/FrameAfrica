'use server';

import { cookies } from 'next/headers';
import { CONSENT_COOKIE } from './consent';

/** Persist the reader's cookie-consent choice (1 year). */
export async function setCookieConsent(accepted: boolean): Promise<void> {
  (await cookies()).set(CONSENT_COOKIE, accepted ? 'accepted' : 'declined', {
    path: '/',
    maxAge: 31_536_000,
    sameSite: 'lax',
  });
}
