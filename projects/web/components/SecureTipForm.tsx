'use client';

import { useState, useTransition } from 'react';
import { submitTip } from '@/lib/tips-actions';
import { useT } from '@/components/LocaleProvider';

/** Confidential news-tip form. Contact is optional; message is required. */
export function SecureTipForm() {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitTip(message, contact);
      if (res.ok) {
        setSent(true);
        setMessage('');
        setContact('');
      } else {
        setError(res.error ?? 'Something went wrong.');
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-accent-green/40 bg-accent-green/5 p-5">
        <p className="font-heading text-lg font-bold text-text">{t('tips.success')}</p>
        <p className="mt-1 font-body text-sm text-muted">{t('tips.successBody')}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
        >
          {t('tips.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border p-5">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t('tips.label')}
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          maxLength={5000}
          placeholder={t('tips.placeholder')}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-text outline-none focus:border-primary"
        />
      </label>
      <label className="mt-3 block">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t('tips.contact')}
        </span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={200}
          placeholder={t('tips.contactPlaceholder')}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-text outline-none focus:border-primary"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-accent-red">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || message.trim().length === 0}
        className="mt-4 rounded-lg bg-primary px-5 py-2 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? t('common.sending') : t('tips.sendSecurely')}
      </button>
    </form>
  );
}
