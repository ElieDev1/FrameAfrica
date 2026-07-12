import Link from 'next/link';
import { MailIcon, PlusIcon } from '@/components/icons';
import type { PodcastShowItem } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function PodcastsAdmin({ shows }: { shows: PodcastShowItem[] }) {
  const locale = await getLocale();
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MailIcon size={20} className="text-primary" />
            <h1 className="font-heading text-3xl font-black tracking-tight text-text">
              {t(locale, 'mm.podcasts')}
            </h1>
          </div>
          <p className="mt-1 font-body text-sm text-muted">
            {t(locale, 'dpod.subtitle')} {shows.length} {t(locale, 'dpod.show')}.
          </p>
        </div>
        <Link
          href="/dashboard/podcasts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={15} /> {t(locale, 'dpod.newShow')}
        </Link>
      </div>

      {shows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-body text-sm text-muted">{t(locale, 'dpod.empty')}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {t(locale, 'dpod.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/podcasts/${s.id}`}
              className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {s.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                    s.status === 'published'
                      ? 'bg-accent-green/15 text-accent-green'
                      : 'bg-surface-2 text-muted ring-1 ring-border'
                  }`}
                >
                  {t(locale, s.status === 'published' ? 'd.common.published' : 'd.common.draft')}
                </span>
                <h3 className="mt-1 line-clamp-1 font-heading text-sm font-bold text-text group-hover:text-primary">
                  {s.title}
                </h3>
                <p className="mt-1 font-mono text-[10px] text-faint">
                  {s.episodeCount} {t(locale, 'dpod.episodes')} · {formatDate(s.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
