'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { type FollowTarget, toggleFollow } from '@/lib/follows-actions';
import { CheckIcon, PlusIcon } from './icons';

/**
 * Follow / Following toggle for a section or topic. Optimistic; signed-out
 * readers are prompted to sign in. Followed subjects appear in the reader's
 * account and drive the personalised feed.
 */
export function FollowButton({
  target,
  id,
  initialFollowing,
  signedIn,
}: {
  target: FollowTarget;
  id: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
      >
        <PlusIcon size={15} aria-hidden />
        Follow
      </Link>
    );
  }

  function onClick() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try {
        const res = await toggleFollow(target, id, next);
        setFollowing(res.following);
      } catch {
        setFollowing(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={following}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
        following
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted hover:border-primary hover:text-primary'
      }`}
    >
      {following ? <CheckIcon size={15} aria-hidden /> : <PlusIcon size={15} aria-hidden />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
