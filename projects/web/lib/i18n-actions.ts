'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, type Locale } from './i18n';

/** Persist the reader's language choice in the `fa-locale` cookie (1 year). */
export async function setLocalePreference(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 31_536_000,
    sameSite: 'lax',
  });
}
