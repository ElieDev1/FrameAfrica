import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentEngagement } from '@/components/ContentEngagement';
import { GalleryViewer } from '@/components/GalleryViewer';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchGallery } from '@/lib/galleries';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await fetchGallery(slug);
  if (!gallery) return { title: 'Gallery not found' };
  return {
    title: gallery.title,
    description: gallery.description ?? undefined,
  };
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [gallery, locale] = await Promise.all([fetchGallery(slug), getLocale()]);
  if (!gallery) notFound();

  return (
    <article className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'gal.kicker')}
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="mt-3 max-w-3xl font-body text-lg leading-relaxed text-muted">
            {gallery.description}
          </p>
        )}
        <p className="mt-3 font-mono text-[11px] text-faint">
          {gallery.author && (
            <span>
              {t(locale, 'gal.by')} {gallery.author.displayName} ·{' '}
            </span>
          )}
          {gallery.images.length} {t(locale, 'gal.photos')}
          {gallery.publishedAt && <span> · {formatDate(gallery.publishedAt)}</span>}
        </p>
      </header>

      <div className="pt-8">
        {gallery.images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10">
            <p className="font-heading text-lg font-bold text-text">{t(locale, 'gal.noPhotos')}</p>
          </div>
        ) : (
          <GalleryViewer images={gallery.images} />
        )}
      </div>

      <ContentEngagement type="gallery" id={gallery.id} path={`/galleries/${gallery.slug}`} />
    </article>
  );
}
