'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { CheckIcon, ChevronDownIcon, LocaleFlag } from '@/components/icons';
import { LOCALES, type Locale, t } from '@/lib/i18n';
import { setLocalePreference } from '@/lib/i18n-actions';

const SHORT: Record<Locale, string> = { en: 'EN', rw: 'RW', fr: 'FR' };
const FULL: Record<Locale, string> = { en: 'English', rw: 'Kinyarwanda', fr: 'Français' };

/**
 * Language switcher: a compact flag + code button that opens a dropdown of the
 * three editions with their national flags. Persists the `fa-locale` cookie via
 * a server action and refreshes so server components re-render in the chosen
 * language (cookie-based; no URL change). `dropUp` opens the menu upward — used
 * in the footer, where a downward menu would fall off the page.
 */
export function LanguageSwitcher({
  current,
  dropUp = false,
}: {
  current: Locale;
  dropUp?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    startTransition(async () => {
      await setLocalePreference(locale);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(current, 'footer.language')}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 font-mono text-[11px] font-semibold text-text transition-colors hover:border-primary disabled:opacity-60"
      >
        <LocaleFlag code={current} />
        <span>{SHORT[current]}</span>
        <ChevronDownIcon
          size={12}
          className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t(current, 'footer.language')}
          className={`absolute right-0 z-40 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {LOCALES.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                role="option"
                aria-selected={locale === current}
                onClick={() => choose(locale)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-body text-sm transition-colors hover:bg-surface-2 ${
                  locale === current ? 'font-semibold text-primary' : 'text-text'
                }`}
              >
                <LocaleFlag code={locale} />
                <span>{FULL[locale]}</span>
                {locale === current && <CheckIcon size={14} className="ml-auto text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
