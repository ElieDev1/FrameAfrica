'use client';

import { useState, useTransition } from 'react';
import { subscribeNewsletter } from '@/lib/newsletter-actions';
import { useT } from '@/components/LocaleProvider';

/** Newsletter signup — persists to the API (WS11). */
export function NewsletterBox() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await subscribeNewsletter(email);
      if (res.ok) {
        setDone(true);
        setEmail('');
      } else {
        setError(res.error ?? 'Something went wrong.');
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface-2 p-5">
      <h2 className="font-heading text-lg font-bold text-text">{t('nlbox.title')}</h2>
      <p className="mt-1 font-body text-sm text-muted">{t('nlbox.subtitle')}</p>
      {done ? (
        <p className="mt-3 rounded-lg border border-accent-green/40 bg-accent-green/5 px-3 py-2 font-body text-sm text-text">
          {t('nlbox.subscribedSuccess')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label={t('nlbox.emailAria')}
            className="rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-3 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t('newsletter.subscribing') : t('newsletter.subscribe')}
          </button>
          {error && (
            <p role="alert" className="font-mono text-[11px] text-accent-red">
              {error}
            </p>
          )}
        </form>
      )}
      <p className="mt-2 font-mono text-[10px] text-faint">{t('nlbox.unsubscribeAnytime')}</p>
    </section>
  );
}
