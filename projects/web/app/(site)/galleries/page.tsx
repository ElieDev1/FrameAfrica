import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchGalleries } from '@/lib/galleries';

export const metadata: Metadata = {
  title: 'Photo galleries',
  description: 'Visual stories from Frame Africa — photojournalism from Rwanda and the continent.',
};

export const revalidate = 300;

export default async function GalleriesPage() {
  const [galleries, locale] = await Promise.all([fetchGalleries(48), getLocale()]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'mm.galleries')}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">{t(locale, 'mm.galleriesSub')}</p>
      </header>

      {galleries.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'mm.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => (
            <Link key={g.id} href={`/galleries/${g.slug}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
                {g.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.coverUrl}
                    alt={g.coverAlt ?? ''}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                  {g.imageCount} photo{g.imageCount === 1 ? '' : 's'}
                </span>
              </div>
              <h2 className="mt-2 font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                {g.title}
              </h2>
              {g.description && (
                <p className="mt-1 line-clamp-2 font-body text-sm text-muted">{g.description}</p>
              )}
              {g.publishedAt && (
                <span className="mt-1 block font-mono text-[11px] text-faint">
                  {formatDate(g.publishedAt)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
