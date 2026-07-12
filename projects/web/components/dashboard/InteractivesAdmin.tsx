import Link from 'next/link';
import { BarChartIcon, PlusIcon } from '@/components/icons';
import type { InteractiveItem } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function InteractivesAdmin({ interactives }: { interactives: InteractiveItem[] }) {
  const locale = await getLocale();
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChartIcon size={20} className="text-primary" />
            <h1 className="font-heading text-3xl font-black tracking-tight text-text">
              {t(locale, 'mm.interactives')}
            </h1>
          </div>
          <p className="mt-1 font-body text-sm text-muted">
            {t(locale, 'dint.subtitle')} {interactives.length} {t(locale, 'd.common.total')}.
          </p>
        </div>
        <Link
          href="/dashboard/interactives/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={15} /> {t(locale, 'dint.newInteractive')}
        </Link>
      </div>

      {interactives.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-body text-sm text-muted">{t(locale, 'dint.empty')}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            {t(locale, 'dint.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {interactives.map((it) => (
            <Link
              key={it.id}
              href={`/dashboard/interactives/${it.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/40"
            >
              <div className="relative aspect-video bg-surface-2">
                {it.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                  {it.provider}
                </span>
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                    it.status === 'published'
                      ? 'bg-accent-green/90 text-white'
                      : 'bg-black/70 text-white'
                  }`}
                >
                  {t(locale, it.status === 'published' ? 'd.common.published' : 'd.common.draft')}
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 font-heading text-sm font-bold text-text group-hover:text-primary">
                  {it.title}
                </h3>
                <p className="mt-1 font-mono text-[10px] text-faint">{formatDate(it.updatedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
