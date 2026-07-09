'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { clearHistory } from '@/lib/history-actions';

/** Clears the reader's reading history, then refreshes the account page. */
export function ClearHistoryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        await clearHistory();
        router.refresh();
      } catch {
        // best-effort; leave the list in place on failure
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="font-mono text-[11px] uppercase tracking-wide text-faint transition hover:text-accent-red disabled:opacity-50"
    >
      {pending ? 'Clearing…' : 'Clear'}
    </button>
  );
}
