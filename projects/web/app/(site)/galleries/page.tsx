import type { Metadata } from 'next';
import Link from 'next/link';
import { ImageIcon } from '@/components/icons';
import { HubSearch } from '@/components/HubSearch';
import { Pager } from '@/components/Pager';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchGalleriesPage } from '@/lib/galleries';
import { PAGE_SIZE, readPage } from '@/lib/paging';

export const metadata: Metadata = {
  title: 'Photo galleries',
  description: 'Visual stories from Frame Africa — photojournalism from Rwanda and the continent.',
};

export const revalidate = 300;

export default async function GalleriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = readPage(sp.page);
  const q = (sp.q ?? '').trim();
  const [{ items: galleries, hasMore }, locale] = await Promise.all([
    fetchGalleriesPage(PAGE_SIZE, page, q),
    getLocale(),
  ]);

  // Photography deserves scale: the newest gallery runs wide, the rest tile.
  // Past page one — and while searching — there's no lead; every gallery tiles.
  const showLead = page === 1 && !q;
  const [lead, ...rest] = showLead ? galleries : [];
  const tiles = showLead ? rest : galleries;

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-1">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <h1 className="sr-only">{t(locale, 'mm.galleries')}</h1>
        <HubSearch
          basePath="/galleries"
          q={q}
          locale={locale}
          placeholderKey="mm.searchGalleries"
        />
      </header>

      {galleries.length === 0 ? (
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
          {/* Lead gallery — full-bleed cover with the copy overlaid */}
          {lead && (
            <Link href={`/galleries/${lead.slug}`} className="group mt-5 block">
              <div className="relative aspect-[21/9] overflow-hidden bg-surface-2 ring-1 ring-border">
                {lead.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lead.coverUrl}
                    alt={lead.coverAlt ?? ''}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    <ImageIcon size={12} />
                    {lead.imageCount} {t(locale, 'gal.photos')}
                  </span>
                  <h2 className="mt-2 max-w-3xl font-heading text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                    {lead.title}
                  </h2>
                  {lead.description && (
                    <p className="mt-2 line-clamp-2 max-w-2xl font-body text-sm text-white/80 sm:text-base">
                      {lead.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {tiles.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tiles.map((g) => (
                <Link key={g.id} href={`/galleries/${g.slug}`} className="group min-w-0">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-2 ring-1 ring-border">
                    {g.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.coverUrl}
                        alt={g.coverAlt ?? ''}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur">
                      {g.imageCount} {t(locale, 'gal.photos')}
                    </span>
                  </div>
                  <h2 className="mt-2.5 line-clamp-2 font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                    {g.title}
                  </h2>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-muted">
                      {g.description}
                    </p>
                  )}
                  {g.publishedAt && (
                    <span className="mt-1.5 block font-mono text-[11px] text-faint">
                      {formatDate(g.publishedAt)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          <Pager
            locale={locale}
            basePath="/galleries"
            page={page}
            hasMore={hasMore}
            query={q ? { q } : undefined}
          />
        </>
      )}
    </div>
  );
}
