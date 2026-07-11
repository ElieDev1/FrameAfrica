'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale, type MessageKey, t as translate } from '@/lib/i18n';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Makes the request locale available to client components (dashboard, forms). */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** A translate function bound to the current locale, for client components. */
export function useT(): (key: MessageKey) => string {
  const locale = useContext(LocaleContext);
  return (key: MessageKey) => translate(locale, key);
}
