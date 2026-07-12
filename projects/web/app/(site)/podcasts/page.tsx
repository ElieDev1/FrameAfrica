import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityIcon } from '@/components/icons';
import { HubSearch } from '@/components/HubSearch';
import { Pager } from '@/components/Pager';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { PAGE_SIZE, readPage } from '@/lib/paging';
import { fetchPodcastShowsPage } from '@/lib/podcasts';

export const metadata: Metadata = {
  title: 'Podcasts',
  description: 'Listen and watch — audio and video podcasts from Frame Africa.',
};

export const revalidate = 300;

export default async function PodcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = readPage(sp.page);
  const q = (sp.q ?? '').trim();
  const [{ items: shows, hasMore }, locale] = await Promise.all([
    fetchPodcastShowsPage(PAGE_SIZE, page, q),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-1">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            {t(locale, 'home.listen')}
          </p>
          <h1 className="mt-0.5 font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'mm.podcasts')}
          </h1>
        </div>
        <HubSearch basePath="/podcasts" q={q} locale={locale} placeholderKey="mm.searchPodcasts" />
      </header>

      {shows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10">
          <p className="font-heading text-lg font-bold text-text">
            {q ? t(locale, 'mm.searchNoResults') : t(locale, 'mm.empty')}
          </p>
          {!q && <p className="mt-1 font-body text-sm text-muted">{t(locale, 'mm.emptyHint')}</p>}
        </div>
      ) : (
        <>
          {q && (
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.12em] text-muted">
              {t(locale, 'mm.searchResults')} “{q}”
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 pt-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shows.map((s) => (
              <Link key={s.id} href={`/podcasts/${s.slug}`} className="group min-w-0">
                <div className="relative aspect-square overflow-hidden bg-surface-2 ring-1 ring-border">
                  {s.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-faint">
                      <ActivityIcon size={28} />
                    </span>
                  )}
                </div>
                <h2 className="mt-2.5 line-clamp-2 font-heading text-base font-bold leading-snug text-text group-hover:text-primary">
                  {s.title}
                </h2>
                {s.description && (
                  <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                )}
                <span className="mt-1.5 block font-mono text-[11px] text-faint">
                  {s.episodeCount}{' '}
                  {t(locale, s.episodeCount === 1 ? 'pod.episode' : 'pod.episodes').toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
          <Pager
            locale={locale}
            basePath="/podcasts"
            page={page}
            hasMore={hasMore}
            query={q ? { q } : undefined}
          />
        </>
      )}
    </div>
  );
}
