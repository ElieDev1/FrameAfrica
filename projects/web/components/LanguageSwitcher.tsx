'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';
import { setLocalePreference } from '@/lib/i18n-actions';

const LABELS: Record<Locale, string> = { en: 'EN', rw: 'RW' };

/**
 * Language switcher: persists the `fa-locale` cookie (via a server action) and
 * refreshes so server components re-render in the chosen language. Cookie-based
 * (no URL change).
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocalePreference(locale);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label="Language">
      {LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-border-2">·</span>}
          <button
            type="button"
            onClick={() => choose(locale)}
            disabled={pending}
            aria-pressed={locale === current}
            className={`rounded px-1 transition-colors disabled:opacity-60 ${
              locale === current ? 'font-bold text-primary' : 'text-faint hover:text-text'
            }`}
          >
            {LABELS[locale]}
          </button>
        </span>
      ))}
    </div>
  );
}
