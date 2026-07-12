'use client';

import { useState } from 'react';
import type { ArticleSummary } from '@/lib/api';
import { fetchMoreArticles } from '@/lib/articles-actions';
import { fetchFeed } from '@/lib/feed-actions';
import { ArticleCard } from './ArticleCard';
import { useT, useLocale } from '@/components/LocaleProvider';

/**
 * A story grid that grows on demand. Renders the first (server-fetched) page,
 * then appends further cursor-paginated pages when the reader clicks "Load
 * more". Scoped by section (`category`) or `topic`.
 */
export function LoadMore({
  initialArticles,
  initialCursor,
  category,
  topic,
  feed = false,
  pageSize = 12,
}: {
  initialArticles: ArticleSummary[];
  initialCursor: string | null;
  category?: string;
  topic?: string;
  /** When true, paginate the signed-in reader's personalised feed instead. */
  feed?: boolean;
  pageSize?: number;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const t = useT();
  const locale = useLocale();

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = feed
        ? await fetchFeed({ cursor, limit: pageSize })
        : await fetchMoreArticles({ category, topic, cursor, limit: pageSize });
      setArticles((prev) => [...prev, ...res.articles]);
      setCursor(res.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>

      {cursor && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-border px-6 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-muted transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.loadMoreStories')}
          </button>
          {error && (
            <p role="alert" className="font-mono text-[11px] text-accent-red">
              {t('common.loadMoreError')}
            </p>
          )}
        </div>
      )}
    </>
  );
}
