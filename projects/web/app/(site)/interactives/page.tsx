import type { Metadata } from 'next';
import Link from 'next/link';
import { EmbedFrame } from '@/components/EmbedFrame';
import { BarChartIcon } from '@/components/icons';
import { HubSearch } from '@/components/HubSearch';
import { Pager } from '@/components/Pager';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchInteractivesPage } from '@/lib/interactives';
import { PAGE_SIZE, readPage } from '@/lib/paging';

export const metadata: Metadata = {
  title: 'Data & interactives',
  description: 'Explore the data — charts and interactive graphics from Frame Africa.',
};

export const revalidate = 300;

export default async function InteractivesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = readPage(sp.page);
  const q = (sp.q ?? '').trim();
  const [{ items, hasMore }, locale] = await Promise.all([
    fetchInteractivesPage(PAGE_SIZE, page, q),
    getLocale(),
  ]);

  // The newest graphic is live on the page — a chart you can read beats a
  // thumbnail of one. The rest tile as cards. Past page one — and while
  // searching — everything tiles.
  const showLead = page === 1 && !q;
  const [lead, ...rest] = showLead ? items : [];
  const tiles = showLead ? rest : items;

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <header className="border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'mm.latest')}
        </p>
        <h1 className="mt-0.5 font-heading text-3xl font-black tracking-tight text-text">
          {t(locale, 'mm.interactives')}
        </h1>
        <HubSearch
          basePath="/interactives"
          q={q}
          locale={locale}
          placeholderKey="mm.searchInteractives"
        />
      </header>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10">
          <p className="font-heading text-lg font-bold text-text">
            {q ? t(locale, 'mm.searchNoResults') : t(locale, 'mm.empty')}
          </p>
          {!q && <p className="mt-1 font-body text-sm text-muted">{t(locale, 'mm.emptyHint')}</p>}
        </div>
      ) : (
        <>
          {/* Lead graphic — rendered live, with its story beside it */}
          {lead && (
            <section className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
              <div className="min-w-0">
                <EmbedFrame src={lead.embedUrl} title={lead.title} aspectRatio={lead.aspectRatio} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-border">
                  <BarChartIcon size={12} className="text-primary" />
                  {lead.provider}
                </span>
                <h2 className="mt-2 font-heading text-2xl font-black leading-tight tracking-tight text-text">
                  <Link href={`/interactives/${lead.slug}`} className="hover:text-primary">
                    {lead.title}
                  </Link>
                </h2>
                {lead.description && (
                  <p className="mt-2 font-body leading-relaxed text-muted">{lead.description}</p>
                )}
                <p className="mt-3 font-mono text-[11px] text-faint">
                  {lead.source && <span>{lead.source} · </span>}
                  {lead.publishedAt && <span>{formatDate(lead.publishedAt)}</span>}
                </p>
              </div>
            </section>
          )}

          {tiles.length > 0 && (
            <section className={showLead ? 'mt-12' : 'mt-8'}>
              <h2 className="mb-5 flex items-center gap-2.5 border-b border-border pb-2 font-heading text-lg font-black uppercase tracking-tight text-text">
                <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
                {q ? `${t(locale, 'mm.searchResults')} “${q}”` : t(locale, 'mm.more')}
              </h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tiles.map((it) => (
                  <Link key={it.id} href={`/interactives/${it.slug}`} className="group min-w-0">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-border">
                      {it.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.coverUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-faint">
                          <BarChartIcon size={26} />
                        </span>
                      )}
                      <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white backdrop-blur">
                        {it.provider}
                      </span>
                    </div>
                    <h3 className="mt-2.5 line-clamp-2 font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                      {it.title}
                    </h3>
                    {it.description && (
                      <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-muted">
                        {it.description}
                      </p>
                    )}
                    {it.publishedAt && (
                      <span className="mt-1.5 block font-mono text-[11px] text-faint">
                        {formatDate(it.publishedAt)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Pager
            locale={locale}
            basePath="/interactives"
            page={page}
            hasMore={hasMore}
            query={q ? { q } : undefined}
          />
        </>
      )}
    </div>
  );
}
