import type { Metadata } from 'next';
import Link from 'next/link';
import { HighlightedSnippet } from '@/components/HighlightedSnippet';
import { formatDate } from '@/lib/format';
import { searchArticles, type SearchResult } from '@/lib/api';

export const metadata: Metadata = { title: 'Search — Frame Africa' };

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const query = ((await searchParams).q ?? '').trim();

  let results: SearchResult[] = [];
  let failed = false;
  if (query) {
    try {
      ({ results } = await searchArticles({ q: query, limit: 30 }));
    } catch {
      failed = true;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
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
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {results.map((r) => (
              <li key={r.id} className="py-5">
                <Link href={`/article/${r.slug}`} className="group block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                    {r.category.name}
                    {r.publishedAt && (
                      <span className="ml-2 text-faint">{formatDate(r.publishedAt)}</span>
                    )}
                  </span>
                  <h2 className="mt-1 font-heading text-xl font-bold text-text group-hover:text-primary">
                    {r.title}
                  </h2>
                  {r.snippet && (
                    <HighlightedSnippet
                      snippet={r.snippet}
                      className="mt-1 block font-body text-sm leading-relaxed text-muted"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
