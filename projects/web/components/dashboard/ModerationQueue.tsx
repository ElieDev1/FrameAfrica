'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useT } from '@/components/LocaleProvider';
import {
  deleteComment,
  type FlaggedComment,
  moderateComment,
  setUserCommentBan,
} from '@/lib/comments-actions';
import type { MessageKey } from '@/lib/i18n';

type Action = 'keep' | 'hide' | 'remove';

const ACTIONS: { action: Action; labelKey: MessageKey; className: string }[] = [
  { action: 'keep', labelKey: 'dmod.keep', className: 'border-border text-muted hover:text-text' },
  { action: 'hide', labelKey: 'dmod.hide', className: 'border-border text-muted hover:text-text' },
  {
    action: 'remove',
    labelKey: 'dmod.remove',
    className: 'border-accent-red/40 text-accent-red hover:bg-accent-red/10',
  },
];

const CSTAT: Record<string, MessageKey> = {
  visible: 'cstat.visible',
  pending: 'cstat.pending',
  hidden: 'cstat.hidden',
  removed: 'cstat.removed',
};

export function ModerationQueue({ initial }: { initial: FlaggedComment[] }) {
  const t = useT();
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

  function removeComment(id: string) {
    if (!confirm(t('dmod.deleteConfirm'))) return;
    setBusy(id);
    startTransition(async () => {
      try {
        await deleteComment(id);
        setQueue((q) => q.filter((c) => c.id !== id));
      } finally {
        setBusy(null);
      }
    });
  }

  function toggleBan(id: string, userId: string, banned: boolean) {
    setBusy(id);
    startTransition(async () => {
      try {
        await setUserCommentBan(userId, banned);
        setQueue((q) =>
          q.map((c) => (c.author.id === userId ? { ...c, author: { ...c.author, banned } } : c)),
        );
      } finally {
        setBusy(null);
      }
    });
  }

  if (queue.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center font-body text-sm text-muted">
        {t('dmod.empty')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {queue.map((c) => (
        <li key={c.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
            <span className="text-text">{c.author.displayName}</span>
            {c.author.banned && (
              <span className="rounded bg-accent-red/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-accent-red">
                {t('dmod.banned')}
              </span>
            )}
            <span>{t('dmod.on')}</span>
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
              {c.target.type}
            </span>
            {c.target.url ? (
              <Link href={c.target.url} className="text-primary hover:underline">
                {c.target.title}
              </Link>
            ) : (
              <span className="text-faint">{c.target.title}</span>
            )}
            <span className="ml-auto flex items-center gap-3">
              <span className="uppercase tracking-[0.14em]">
                {CSTAT[c.status] ? t(CSTAT[c.status]) : c.status}
              </span>
              {c.reportCount > 0 && (
                <span className="text-accent-red">
                  ⚑ {c.reportCount} {t('dmod.reports')}
                </span>
              )}
            </span>
          </div>
          <p className="mb-3 whitespace-pre-line font-body text-[0.95rem] leading-relaxed text-text">
            {c.body}
          </p>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.action}
                type="button"
                disabled={busy === c.id}
                onClick={() => act(c.id, a.action)}
                className={`rounded-md border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${a.className}`}
              >
                {t(a.labelKey)}
              </button>
            ))}
            <button
              type="button"
              disabled={busy === c.id}
              onClick={() => removeComment(c.id)}
              className="rounded-md border border-accent-red/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-red transition-colors hover:bg-accent-red/10 disabled:opacity-50"
            >
              {t('dmod.delete')}
            </button>
            <button
              type="button"
              disabled={busy === c.id}
              onClick={() => toggleBan(c.id, c.author.id, !c.author.banned)}
              className="ml-auto rounded-md border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-accent-red disabled:opacity-50"
            >
              {c.author.banned ? t('dmod.unbanAuthor') : t('dmod.banAuthor')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
