'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toggleBookmark } from '@/lib/bookmarks-actions';
import { useLocale } from '@/components/LocaleProvider';
import { t } from '@/lib/i18n';

/**
 * "Save" (bookmark) control on an article. Optimistic toggle; signed-out readers
 * are prompted to sign in. Saved stories appear in the reader's account.
 */
export function SaveButton({
  articleId,
  initialSaved,
  signedIn,
}: {
  articleId: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const locale = useLocale();

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted transition hover:border-primary hover:text-primary"
      >
        <span aria-hidden>🔖</span> {t(locale, 'common.save')}
      </Link>
    );
  }

  function onClick() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        const res = await toggleBookmark(articleId, next);
        setSaved(res.saved);
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs transition disabled:opacity-60 ${
        saved
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted hover:border-primary hover:text-primary'
      }`}
    >
      <span aria-hidden>{saved ? '🔖' : '🔖'}</span>
      {saved ? t(locale, 'common.saved') : t(locale, 'common.save')}
    </button>
  );
}
