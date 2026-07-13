'use client';

import { useState, useTransition } from 'react';
import { BellIcon, CheckIcon } from '@/components/icons';
import { generatePushKeys } from '@/lib/push-actions';

/**
 * Breaking-news alerts, in Settings.
 *
 * Web push needs a VAPID key pair. Nobody should have to run a CLI and paste a
 * private key into a form to get one, so the newsroom mints it here — and is
 * warned that minting a *new* one silently cuts off every browser already
 * subscribed under the old one.
 */
export function PushKeysCard({
  configured,
  subscribers,
}: {
  configured: boolean;
  subscribers: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  function generate(force: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await generatePushKeys(force);
      if (!res.ok) setError(res.error ?? 'Could not generate the keys.');
      setRotating(false);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-text">
            <BellIcon size={16} className="text-primary" />
            Breaking-news alerts
          </h2>
          <p className="mt-0.5 max-w-xl font-body text-sm text-muted">
            Push a headline to a reader’s phone the moment a breaking story is published — even when
            the site is closed. Needs one key pair; readers see the opt-in in the footer only once
            it exists.
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 font-mono text-[11px] ${
            configured ? 'bg-accent-green/10 text-accent-green' : 'bg-surface-2 text-faint'
          }`}
        >
          {configured ? `${subscribers} subscribed` : 'not set up'}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] text-accent-red"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!configured ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => generate(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            <CheckIcon size={14} />
            {pending ? 'Generating…' : 'Generate keys'}
          </button>
        ) : rotating ? (
          <>
            <p className="w-full font-mono text-[11px] leading-snug text-accent-red">
              New keys mean a new identity: every one of the {subscribers} browsers already
              subscribed stops receiving alerts and has to opt in again. Only do this if the private
              key has leaked.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => generate(true)}
              className="rounded-lg bg-accent-red px-4 py-2 font-heading text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Rotating…' : 'Yes, rotate the keys'}
            </button>
            <button
              type="button"
              onClick={() => setRotating(false)}
              className="rounded-lg border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setRotating(true)}
            className="rounded-lg border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition hover:border-accent-red hover:text-accent-red"
          >
            Rotate keys
          </button>
        )}
      </div>
    </section>
  );
}
