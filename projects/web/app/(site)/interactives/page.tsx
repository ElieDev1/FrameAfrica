import type { Metadata } from 'next';
import Link from 'next/link';
import { EmbedFrame } from '@/components/EmbedFrame';
import { BarChartIcon } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchInteractives } from '@/lib/interactives';

export const metadata: Metadata = {
  title: 'Data & interactives',
  description: 'Explore the data — charts and interactive graphics from Frame Africa.',
};

export const revalidate = 300;

export default async function InteractivesPage() {
  const [items, locale] = await Promise.all([fetchInteractives(48), getLocale()]);

  // The newest graphic is live on the page — a chart you can read beats a
  // thumbnail of one. The rest tile as cards.
  const [lead, ...rest] = items;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'mm.latest')}
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'mm.interactives')}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">{t(locale, 'mm.interactivesSub')}</p>
      </header>

      {!lead ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10">
          <p className="font-heading text-lg font-bold text-text">{t(locale, 'mm.empty')}</p>
          <p className="mt-1 font-body text-sm text-muted">{t(locale, 'mm.emptyHint')}</p>
        </div>
      ) : (
        <>
          {/* Lead graphic — rendered live, with its story beside it */}
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

          {rest.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 flex items-center gap-2.5 border-b border-border pb-2 font-heading text-lg font-black uppercase tracking-tight text-text">
                <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
                {t(locale, 'mm.more')}
              </h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rest.map((it) => (
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
        </>
      )}
    </div>
  );
}
