import type { Metadata } from 'next';
import Link from 'next/link';
import { HighlightedSnippet } from '@/components/HighlightedSnippet';
import { formatDate } from '@/lib/format';
import { type MediaSearchResult, searchArticles, searchMedia, type SearchResult } from '@/lib/api';
import { getLocale } from '@/lib/i18n-server';
import { type Locale, type MessageKey, t, translateCategory } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, 'search.metaTitle') };
}

type PageProps = { searchParams: Promise<{ q?: string }> };

const MEDIA_LABEL: Record<MediaSearchResult['kind'], MessageKey> = {
  gallery: 'mm.galleries',
  episode: 'mm.podcasts',
  video: 'mm.videos',
  interactive: 'mm.interactives',
};

/** Galleries, episodes, videos and interactives that match — the whole site, not just the archive. */
function MediaResults({ locale, media }: { locale: Locale; media: MediaSearchResult[] }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2.5 border-b border-border pb-2 font-heading text-sm font-black uppercase tracking-tight text-text">
        <span aria-hidden className="h-3.5 w-1 rounded-full bg-primary" />
        {t(locale, 'nav.multimedia')}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {media.map((m) => (
          <li key={`${m.kind}:${m.id}`}>
            <Link href={m.url} className="group flex gap-4">
              <span className="media-fill relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote media host
                  <img
                    src={m.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  {t(locale, MEDIA_LABEL[m.kind])}
                  {m.publishedAt && (
                    <span className="ml-2 text-faint">{formatDate(m.publishedAt)}</span>
                  )}
                </span>
                <span className="mt-1 block font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                  {m.title}
                </span>
                {m.description && (
                  <span className="mt-1 line-clamp-2 block font-body text-sm leading-relaxed text-muted">
                    {m.description}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = ((await searchParams).q ?? '').trim();
  const locale = await getLocale();

  let results: SearchResult[] = [];
  // Search covers the whole site, so multimedia is swept alongside the archive.
  let media: MediaSearchResult[] = [];
  let failed = false;
  if (query) {
    try {
      const [articles, mediaHits] = await Promise.all([
        searchArticles({ q: query, limit: 30 }),
        searchMedia(query),
      ]);
      results = articles.results;
      media = mediaHits;
    } catch {
      failed = true;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'search.title')}
      </h1>

      <form action="/search" className="mt-6 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t(locale, 'search.placeholder')}
          aria-label={t(locale, 'search.ariaLabel')}
          autoFocus
          className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 font-body text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black hover:opacity-90"
        >
          {t(locale, 'search.title')}
        </button>
      </form>

      {query === '' ? (
        <p className="mt-10 font-body text-muted">{t(locale, 'search.emptyPrompt')}</p>
      ) : failed ? (
        <p className="mt-10 font-body text-muted">{t(locale, 'search.error')}</p>
      ) : results.length === 0 && media.length === 0 ? (
        <p className="mt-10 font-body text-muted">
          {t(locale, 'search.noResults')} — “{query}”
        </p>
      ) : (
        <>
          {results.length > 0 && (
            <>
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                {results.length} {results.length === 1 ? 'result' : 'results'}{' '}
                {t(locale, 'search.resultsFor').toLowerCase()} “{query}”
              </p>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {results.map((r) => (
                  <li key={r.id} className="py-5">
                    <Link href={`/article/${r.slug}`} className="group block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                        {translateCategory(locale, r.category.slug, r.category.name)}
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

          {media.length > 0 && <MediaResults locale={locale} media={media} />}
        </>
      )}
    </div>
  );
}
