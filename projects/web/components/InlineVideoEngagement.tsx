'use client';

import Link from 'next/link';
import { useActionState, useCallback, useEffect, useState, useTransition } from 'react';
import { CommentThread, countComments } from '@/components/CommentsSection';
import { EngagementBar } from '@/components/EngagementBar';
import { CommentIcon } from '@/components/icons';
import { useLocale, useT } from '@/components/LocaleProvider';
import {
  type CommentFormState,
  type InlineEngagement,
  loadEngagement,
  postContentComment,
} from '@/lib/engagement-actions';
import type { EngagementTarget } from '@/lib/engagement';
import { t } from '@/lib/i18n';

/**
 * Like / share / comment for the clip the reader is watching — right on the hub,
 * no separate page. It re-loads whenever `id` changes (they picked another video)
 * and after they post, so the strip and the thread always match the stage.
 */
export function InlineVideoEngagement({
  type,
  id,
  path,
}: {
  type: EngagementTarget;
  id: string;
  /** The hub's route, revalidated when a comment is posted. */
  path: string;
}) {
  const t2 = useT();
  // Tag the loaded data with the clip it belongs to. When `id` changes we derive
  // "still loading" from the tag (no synchronous reset), so counts are never stale.
  const [loaded, setLoaded] = useState<{ id: string; data: InlineEngagement } | null>(null);
  const [, startLoad] = useTransition();

  const refresh = useCallback(() => {
    startLoad(async () => setLoaded({ id, data: await loadEngagement(type, id) }));
  }, [type, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const data = loaded?.id === id ? loaded.data : null;

  if (!data) {
    return (
      <div className="mt-6 border-t border-border pt-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {t2('common.loading')}
        </p>
      </div>
    );
  }

  const total = countComments(data.comments);

  return (
    <div className="mt-6 border-t border-border pt-5">
      <EngagementBar type={type} id={id} initial={data.counts} signedIn={data.signedIn} />

      <section id="comments" aria-labelledby="inline-comments-heading" className="mt-8">
        <h2
          id="inline-comments-heading"
          className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
        >
          <CommentIcon size={14} />
          {t2('comments.title')}
          {total > 0 ? ` (${total})` : ''}
        </h2>

        {data.signedIn ? (
          // Keyed on `id` so switching clips resets the composer's action + state.
          <div className="mb-8">
            <InlineComposer key={id} type={type} id={id} path={path} onPosted={refresh} />
          </div>
        ) : (
          <p className="mb-8 font-body text-sm text-muted">
            <Link href="/login" className="text-primary hover:underline">
              {t2('comments.signIn')}
            </Link>
            {t2('comments.toJoin')}
          </p>
        )}

        {data.comments.length > 0 ? (
          <CommentThread comments={data.comments} signedIn={data.signedIn} />
        ) : (
          <p className="font-body text-sm text-muted">{t2('comments.empty')}</p>
        )}
      </section>
    </div>
  );
}

/**
 * The composer, wired so a successful post re-loads the thread in place (the
 * shared `CommentForm` relies on a full-page revalidate, which the client-side
 * hub can't see).
 */
function InlineComposer({
  type,
  id,
  path,
  onPosted,
}: {
  type: EngagementTarget;
  id: string;
  path: string;
  onPosted: () => void;
}) {
  const locale = useLocale();
  const action = postContentComment.bind(null, type, id, path);
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(action, {});

  useEffect(() => {
    if (state.ok) onPosted();
  }, [state.ok, onPosted]);

  return (
    <form action={formAction} className="flex flex-col gap-3" key={state.ok ? 'posted' : 'idle'}>
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={t(locale, 'comments.placeholder')}
        className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-body text-text outline-none focus:border-primary"
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition disabled:opacity-60"
      >
        {pending ? t(locale, 'comments.posting') : t(locale, 'comments.post')}
      </button>
    </form>
  );
}
