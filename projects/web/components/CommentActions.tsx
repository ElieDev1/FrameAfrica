'use client';

import { useState, useTransition } from 'react';
import { CheckIcon, FlagIcon, HeartFilledIcon, HeartIcon } from '@/components/icons';
import { reportComment, toggleCommentLike } from '@/lib/comments-actions';

/** Like + report controls for a single comment (client — talks to the BFF). */
export function CommentActions({
  id,
  initialLikes,
  signedIn,
}: {
  id: string;
  initialLikes: number;
  signedIn: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [reported, setReported] = useState(false);
  const [, startTransition] = useTransition();

  if (!signedIn) {
    return likes > 0 ? (
      <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-faint">
        <HeartIcon size={13} /> {likes}
      </div>
    ) : null;
  }

  function like() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const state = await toggleCommentLike(id, next);
        setLiked(state.liked);
        setLikes(state.likeCount);
      } catch {
        // Roll back the optimistic update on failure.
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }

  function report() {
    if (reported) return;
    setReported(true);
    startTransition(async () => {
      try {
        await reportComment(id);
      } catch {
        setReported(false);
      }
    });
  }

  return (
    <div className="mt-1 flex items-center gap-4 font-mono text-[11px]">
      <button
        type="button"
        onClick={like}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
        className={`inline-flex items-center gap-1 ${liked ? 'text-accent-red' : 'text-muted hover:text-primary'}`}
      >
        {liked ? <HeartFilledIcon size={14} /> : <HeartIcon size={14} />} {likes}
      </button>
      {reported ? (
        <span className="inline-flex items-center gap-1 text-faint">
          <CheckIcon size={13} /> Reported
        </span>
      ) : (
        <button
          type="button"
          onClick={report}
          className="inline-flex items-center gap-1 text-muted hover:text-accent-red"
        >
          <FlagIcon size={13} /> Report
        </button>
      )}
    </div>
  );
}
