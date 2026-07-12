'use client';

import { useState, useTransition } from 'react';
import { CommentIcon, HeartFilledIcon, HeartIcon, LinkIcon, ShareIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { EngagementCounts, EngagementTarget } from '@/lib/engagement';
import { recordShare, toggleLike } from '@/lib/engagement-actions';

const btn =
  'inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition disabled:opacity-60';

/**
 * Like / share / comment-count bar. One component for every content type —
 * articles, galleries, podcast episodes, interactives and videos all pass their
 * `(type, id)` and get the same surface.
 */
export function EngagementBar({
  type,
  id,
  initial,
  signedIn,
  commentsHref = '#comments',
}: {
  type: EngagementTarget;
  id: string;
  initial: EngagementCounts;
  signedIn: boolean;
  commentsHref?: string;
}) {
  const t = useT();
  const [counts, setCounts] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function onLike() {
    // Optimistic: the button should feel instant, and the server reply corrects it.
    const next = !counts.liked;
    setCounts((c) => ({
      ...c,
      liked: next,
      likeCount: Math.max(0, c.likeCount + (next ? 1 : -1)),
    }));
    start(async () => {
      const fresh = await toggleLike(type, id, next);
      if (fresh) setCounts(fresh);
    });
  }

  async function onShare() {
    const url = window.location.href;
    // Native share sheet on mobile; clipboard everywhere else.
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      return; // the reader dismissed the sheet — not a share
    }
    start(async () => {
      const fresh = await recordShare(type, id);
      if (fresh) setCounts(fresh);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onLike}
        disabled={pending}
        aria-pressed={counts.liked}
        title={signedIn ? undefined : t('eng.signInToLike')}
        className={`${btn} ${
          counts.liked
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'text-muted hover:border-primary hover:text-primary'
        }`}
      >
        {counts.liked ? <HeartFilledIcon size={14} /> : <HeartIcon size={14} />}
        {counts.likeCount > 0 ? counts.likeCount : t('eng.like')}
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={pending}
        className={`${btn} text-muted hover:border-primary hover:text-primary`}
      >
        {copied ? <LinkIcon size={14} /> : <ShareIcon size={14} />}
        {copied ? t('eng.copied') : counts.shareCount > 0 ? counts.shareCount : t('eng.share')}
      </button>

      <a
        href={commentsHref}
        className={`${btn} text-muted hover:border-primary hover:text-primary`}
      >
        <CommentIcon size={14} />
        {counts.commentCount > 0 ? counts.commentCount : t('eng.comments')}
      </a>
    </div>
  );
}
