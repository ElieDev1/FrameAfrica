'use client';

import { useTransition } from 'react';
import { useT } from '@/components/LocaleProvider';
import { adminArticleStatusAction, adminDeleteArticleAction } from '@/lib/cms-actions';

/** Admin god-mode controls for a single article (edit page). */
export function ArticleAdminActions({ id, status }: { id: string; status: string }) {
  const t = useT();
  const [pending, start] = useTransition();

  const setStatus = (action: 'publish' | 'unpublish' | 'archive') =>
    start(async () => {
      await adminArticleStatusAction(id, action);
    });

  const remove = () => {
    if (!confirm(t('daa.deleteConfirm'))) return;
    start(async () => {
      await adminDeleteArticleAction(id);
    });
  };

  const btn =
    'rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        {t('daa.admin')}
      </span>
      {status !== 'published' && (
        <button
          type="button"
          onClick={() => setStatus('publish')}
          disabled={pending}
          className={`${btn} border-primary text-primary hover:bg-primary hover:text-black`}
        >
          {t('daa.publishNow')}
        </button>
      )}
      {status === 'published' && (
        <button
          type="button"
          onClick={() => setStatus('unpublish')}
          disabled={pending}
          className={`${btn} border-border text-muted hover:text-text`}
        >
          {t('d.common.unpublish')}
        </button>
      )}
      <button
        type="button"
        onClick={() => setStatus('archive')}
        disabled={pending || status === 'archived'}
        className={`${btn} border-border text-muted hover:text-text`}
      >
        {t('daa.archive')}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={`${btn} border-accent-red/40 text-accent-red hover:bg-accent-red/10`}
      >
        {t('d.common.delete')}
      </button>
    </div>
  );
}
