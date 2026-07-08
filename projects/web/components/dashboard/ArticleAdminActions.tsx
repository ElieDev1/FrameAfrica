'use client';

import { useTransition } from 'react';
import { adminArticleStatusAction, adminDeleteArticleAction } from '@/lib/cms-actions';

/** Admin god-mode controls for a single article (edit page). */
export function ArticleAdminActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();

  const setStatus = (action: 'publish' | 'unpublish' | 'archive') =>
    start(async () => {
      await adminArticleStatusAction(id, action);
    });

  const remove = () => {
    if (!confirm('Delete this article? It moves to Trash and can be restored.')) return;
    start(async () => {
      await adminDeleteArticleAction(id);
    });
  };

  const btn =
    'rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        Admin
      </span>
      {status !== 'published' && (
        <button
          type="button"
          onClick={() => setStatus('publish')}
          disabled={pending}
          className={`${btn} border-primary text-primary hover:bg-primary hover:text-black`}
        >
          Publish now
        </button>
      )}
      {status === 'published' && (
        <button
          type="button"
          onClick={() => setStatus('unpublish')}
          disabled={pending}
          className={`${btn} border-border text-muted hover:text-text`}
        >
          Unpublish
        </button>
      )}
      <button
        type="button"
        onClick={() => setStatus('archive')}
        disabled={pending || status === 'archived'}
        className={`${btn} border-border text-muted hover:text-text`}
      >
        Archive
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={`${btn} border-accent-red/40 text-accent-red hover:bg-accent-red/10`}
      >
        Delete
      </button>
    </div>
  );
}
