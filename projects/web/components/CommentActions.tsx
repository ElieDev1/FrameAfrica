'use client';

import { useState, useTransition } from 'react';
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
    return (
      <div className="mt-1 font-mono text-[11px] text-faint">{likes > 0 ? `♥ ${likes}` : ''}</div>
    );
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
        className={liked ? 'text-accent-red' : 'text-muted hover:text-primary'}
      >
        ♥ {likes}
      </button>
      {reported ? (
        <span className="text-faint">Reported ✓</span>
      ) : (
        <button type="button" onClick={report} className="text-muted hover:text-accent-red">
          Report
        </button>
      )}
    </div>
  );
}
