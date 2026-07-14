import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './i18n';

/**
 * The active locale for this request: the `fa-locale` cookie if the reader has
 * chosen an edition, otherwise English (the default). We deliberately don't
 * auto-switch on the browser's `Accept-Language` — a first-time visitor always
 * lands in English and picks another language from the masthead switcher.
 * Server-only (uses `next/headers`) — kept apart from the client-safe `i18n`.
 */
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return DEFAULT_LOCALE;
}
