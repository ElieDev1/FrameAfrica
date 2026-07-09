'use client';

import { useState, useTransition } from 'react';
import { submitTip } from '@/lib/tips-actions';

/** Confidential news-tip form. Contact is optional; message is required. */
export function SecureTipForm() {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        <p className="font-heading text-lg font-bold text-text">Thank you.</p>
        <p className="mt-1 font-body text-sm text-muted">
          Your tip has reached our newsroom. If you left a contact and it checks out, an editor may
          follow up.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border p-5">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Your tip
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          maxLength={5000}
          placeholder="What should we look into? Include what you know, and where it happened."
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-text outline-none focus:border-primary"
        />
      </label>
      <label className="mt-3 block">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Contact (optional)
        </span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={200}
          placeholder="An email or phone, only if you want us to reach you"
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
        {pending ? 'Sending…' : 'Send securely'}
      </button>
    </form>
  );
}
