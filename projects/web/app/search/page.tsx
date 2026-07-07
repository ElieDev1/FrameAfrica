import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { fetchArticles, type ArticleSummary } from '@/lib/api';

export const metadata: Metadata = { title: 'Search — Frame Africa' };

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const query = ((await searchParams).q ?? '').trim();

  let results: ArticleSummary[] = [];
  let failed = false;
  if (query) {
    try {
      ({ articles: results } = await fetchArticles({ q: query, limit: 30 }));
    } catch {
      failed = true;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Search</h1>

      <form action="/search" className="mt-6 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search published stories…"
          aria-label="Search articles"
          autoFocus
          className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 font-body text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black hover:opacity-90"
        >
          Search
        </button>
      </form>

      {query === '' ? (
        <p className="mt-10 font-body text-muted">Type a term above to search published stories.</p>
      ) : failed ? (
        <p className="mt-10 font-body text-muted">
          Search is unavailable right now. Please try again shortly.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-10 font-body text-muted">
          No results for “{query}”. Try different keywords.
        </p>
      ) : (
        <>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
          </p>
          <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
