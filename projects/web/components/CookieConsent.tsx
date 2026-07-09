'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { setCookieConsent } from '@/lib/consent-actions';

/**
 * Cookie-consent banner. Shows until the reader chooses; the choice is stored in
 * the `fa-cookie-consent` cookie (via a server action). `initialDecided` comes
 * from the server so the banner never flashes for readers who already chose.
 */
export function CookieConsent({ initialDecided }: { initialDecided: boolean }) {
  const [decided, setDecided] = useState(initialDecided);
  const [, startTransition] = useTransition();

  if (decided) return null;

  function choose(accepted: boolean) {
    setDecided(true);
    startTransition(() => {
      void setCookieConsent(accepted);
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-sm text-muted">
          We use cookies to keep you signed in and remember your preferences. See our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            privacy notice
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-lg border border-border px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition hover:text-text"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-lg bg-primary px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-black transition hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
