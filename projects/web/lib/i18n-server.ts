import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './i18n';

/**
 * The active locale for this request: the `fa-locale` cookie if set and valid,
 * otherwise the browser's `Accept-Language`, otherwise English. Server-only
 * (uses `next/headers`) — kept apart from the client-safe `i18n` module.
 */
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const accept = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  if (accept.includes('rw')) return 'rw';
  return DEFAULT_LOCALE;
}
