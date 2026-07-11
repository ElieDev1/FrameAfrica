import type { Metadata } from 'next';
import Link from 'next/link';
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

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'mm.interactives')}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">{t(locale, 'mm.interactivesSub')}</p>
      </header>

      {items.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'mm.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.id} href={`/interactives/${it.slug}`} className="group">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
                {it.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                )}
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                  {it.provider}
                </span>
              </div>
              <h2 className="mt-2 font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                {it.title}
              </h2>
              {it.description && (
                <p className="mt-1 line-clamp-2 font-body text-sm text-muted">{it.description}</p>
              )}
              {it.publishedAt && (
                <span className="mt-1 block font-mono text-[11px] text-faint">
                  {formatDate(it.publishedAt)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
