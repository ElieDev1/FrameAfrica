import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GalleryViewer } from '@/components/GalleryViewer';
import { formatDate } from '@/lib/format';
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
  const gallery = await fetchGallery(slug);
  if (!gallery) notFound();

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Photo gallery</p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="mt-3 max-w-3xl font-body text-lg text-muted">{gallery.description}</p>
        )}
        <p className="mt-3 font-mono text-[11px] text-faint">
          {gallery.author && <span>By {gallery.author.displayName} · </span>}
          {gallery.images.length} photo{gallery.images.length === 1 ? '' : 's'}
          {gallery.publishedAt && <span> · {formatDate(gallery.publishedAt)}</span>}
        </p>
      </header>

      <div className="pt-8">
        {gallery.images.length === 0 ? (
          <p className="py-16 text-center font-body text-muted">This gallery has no photos yet.</p>
        ) : (
          <GalleryViewer images={gallery.images} />
        )}
      </div>
    </article>
  );
}
