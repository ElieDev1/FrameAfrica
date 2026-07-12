import type { Metadata } from 'next';
import { HubSearch } from '@/components/HubSearch';
import { Pager } from '@/components/Pager';
import { VideoHub } from '@/components/VideoHub';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { PAGE_SIZE, readPage } from '@/lib/paging';
import { fetchVideosPage } from '@/lib/videos';

export const metadata: Metadata = {
  title: 'Video',
  description: 'Watch Frame Africa — reporting, explainers and interviews.',
};

export const revalidate = 300;

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = readPage(sp.page);
  const q = (sp.q ?? '').trim();
  const [{ items: videos, hasMore }, locale] = await Promise.all([
    fetchVideosPage(PAGE_SIZE, page, q),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <header className="border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'home.watch')}
        </p>
        <h1 className="mt-0.5 font-heading text-3xl font-black tracking-tight text-text">
          {t(locale, 'mm.videos')}
        </h1>
        <HubSearch basePath="/videos" q={q} locale={locale} placeholderKey="mm.searchVideos" />
      </header>

      {videos.length === 0 ? (
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
          {/* Keyed on page + query so the stage resets to the first hit on a new search. */}
          <VideoHub key={`${page}:${q}`} videos={videos} />
          <Pager
            locale={locale}
            basePath="/videos"
            page={page}
            hasMore={hasMore}
            query={q ? { q } : undefined}
          />
        </>
      )}
    </div>
  );
}
