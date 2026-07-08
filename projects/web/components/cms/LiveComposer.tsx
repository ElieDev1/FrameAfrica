'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addLiveUpdateAction, endLiveAction, type LiveComposeState } from '@/lib/live-actions';

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

function PostButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-accent-red px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Posting…' : 'Post update'}
    </button>
  );
}

/**
 * Newsroom composer for live/developing coverage: post timestamped updates to a
 * published story and end coverage. Posting the first update makes the story go
 * live for readers.
 */
export function LiveComposer({
  articleId,
  slug,
  isLive,
}: {
  articleId: string;
  slug: string;
  isLive: boolean;
}) {
  const post = addLiveUpdateAction.bind(null, articleId, slug);
  const [state, formAction] = useActionState<LiveComposeState, FormData>(post, {});
  const end = endLiveAction.bind(null, articleId, slug);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Live coverage {isLive && <span className="text-accent-red">· ON AIR</span>}
        </p>
        {isLive && (
          <form action={end}>
            <button
              type="submit"
              className="rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-accent-red hover:text-accent-red"
            >
              End coverage
            </button>
          </form>
        )}
      </div>

      <form action={formAction} className="flex flex-col gap-2">
        <input
          name="headline"
          maxLength={200}
          placeholder="Headline (optional)"
          className={input}
        />
        <textarea
          name="body"
          rows={2}
          maxLength={4000}
          required
          placeholder="Post an update — readers see it appear live…"
          className={input}
        />
        <label className="flex items-center gap-2 font-body text-xs text-muted">
          <input type="checkbox" name="isKeyEvent" className="accent-primary" />
          Mark as a key event
        </label>
        {state.error && (
          <p role="alert" className="font-mono text-xs text-accent-red">
            {state.error}
          </p>
        )}
        {state.postedAt && <p className="font-mono text-xs text-accent-green">Update posted ✓</p>}
        <PostButton />
      </form>
    </div>
  );
}
