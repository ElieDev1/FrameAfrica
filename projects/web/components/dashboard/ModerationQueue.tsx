'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { type FlaggedComment, moderateComment } from '@/lib/comments-actions';

type Action = 'keep' | 'hide' | 'remove';

const ACTIONS: { action: Action; label: string; className: string }[] = [
  { action: 'keep', label: 'Keep', className: 'border-border text-muted hover:text-text' },
  { action: 'hide', label: 'Hide', className: 'border-border text-muted hover:text-text' },
  {
    action: 'remove',
    label: 'Remove',
    className: 'border-accent-red/40 text-accent-red hover:bg-accent-red/10',
  },
];

export function ModerationQueue({ initial }: { initial: FlaggedComment[] }) {
  const [queue, setQueue] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function act(id: string, action: Action) {
    setBusy(id);
    startTransition(async () => {
      try {
        await moderateComment(id, action);
        setQueue((q) => q.filter((c) => c.id !== id));
      } finally {
        setBusy(null);
      }
    });
  }

  if (queue.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center font-body text-sm text-muted">
        Nothing to moderate — the queue is clear.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {queue.map((c) => (
        <li key={c.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
            <span className="text-text">{c.author.displayName}</span>
            <span>on</span>
            <Link href={`/article/${c.article.slug}`} className="text-primary hover:underline">
              {c.article.title}
            </Link>
            <span className="ml-auto flex items-center gap-3">
              <span className="uppercase tracking-[0.14em]">{c.status}</span>
              {c.reportCount > 0 && (
                <span className="text-accent-red">
                  ⚑ {c.reportCount} report{c.reportCount === 1 ? '' : 's'}
                </span>
              )}
            </span>
          </div>
          <p className="mb-3 whitespace-pre-line font-body text-[0.95rem] leading-relaxed text-text">
            {c.body}
          </p>
          <div className="flex gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.action}
                type="button"
                disabled={busy === c.id}
                onClick={() => act(c.id, a.action)}
                className={`rounded-md border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${a.className}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
