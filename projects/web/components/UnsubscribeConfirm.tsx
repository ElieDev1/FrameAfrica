'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { unsubscribeNewsletter } from '@/lib/newsletter-actions';
import { useT } from '@/components/LocaleProvider';

/** One-click unsubscribe confirmation, keyed by the token in the email link. */
export function UnsubscribeConfirm({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  const [pending, startTransition] = useTransition();
  const t = useT();

  function onClick() {
    startTransition(async () => {
      const ok = await unsubscribeNewsletter(token);
      setState(ok ? 'done' : 'error');
    });
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-border p-5">
        <p className="font-heading text-lg font-bold text-text">{t('nl.unsubscribed')}</p>
        <p className="mt-1 font-body text-sm text-muted">{t('nl.unsubscribedBody')}</p>
        <Link href="/" className="mt-3 inline-block font-mono text-xs text-primary hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <p className="font-body text-text">{t('nl.unsubscribeConfirm')}</p>
      {state === 'error' && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-accent-red">
          {t('nl.unsubscribeError')}
        </p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mt-4 rounded-lg border border-accent-red/50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-accent-red transition hover:bg-accent-red/10 disabled:opacity-50"
      >
        {pending ? t('nl.unsubscribing') : t('nl.confirmUnsubscribe')}
      </button>
    </div>
  );
}
