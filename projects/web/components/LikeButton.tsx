'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { HeartFilledIcon, HeartIcon } from '@/components/icons';
import { toggleLike } from '@/lib/likes-actions';
import { useLocale } from '@/components/LocaleProvider';
import { t } from '@/lib/i18n';

/**
 * Reader "like" control on an article. Optimistically toggles and reconciles
 * with the server count. Signed-out readers see a prompt to sign in.
 */
export function LikeButton({
  articleId,
  initialLiked,
  initialCount,
  signedIn,
}: {
  articleId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const locale = useLocale();

  const label = count === 1 ? t(locale, 'article.like') : t(locale, 'article.likes');

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted transition hover:border-primary hover:text-primary"
      >
        <HeartIcon size={16} />
        {count} {label} · {t(locale, 'article.signInToLike')}
      </Link>
    );
  }

  function onClick() {
    const next = !liked;
    // Optimistic update.
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await toggleLike(articleId, next);
        setLiked(res.liked);
        setCount(res.likeCount);
      } catch {
        // Roll back on failure.
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs transition disabled:opacity-60 ${
        liked
          ? 'border-accent-red bg-accent-red/10 text-accent-red'
          : 'border-border text-muted hover:border-primary hover:text-primary'
      }`}
    >
      {liked ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
      {count} {label}
    </button>
  );
}
