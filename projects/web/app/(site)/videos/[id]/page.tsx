import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentEngagement } from '@/components/ContentEngagement';
import { VideoEmbed } from '@/components/VideoEmbed';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchVideo } from '@/lib/videos';

export const revalidate = 300;

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideo(id);
  if (!video) return { title: 'Video not found' };
  return { title: video.title, description: video.description ?? undefined };
}

export default async function WatchPage({ params }: { params: Params }) {
  const { id } = await params;
  const [video, locale] = await Promise.all([fetchVideo(id), getLocale()]);
  if (!video) notFound();

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-8">
      <Link href="/videos" className="font-mono text-xs text-primary hover:underline">
        ← {t(locale, 'mm.videos')}
      </Link>

      <div className="pt-4">
        <VideoEmbed
          youtubeId={video.youtubeId}
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>

      <h1 className="mt-4 font-heading text-3xl font-black leading-tight tracking-tight text-text">
        {video.title}
      </h1>
      <p className="mt-1 font-mono text-[11px] text-faint">{formatDate(video.publishedAt)}</p>
      {video.description && (
        <p className="mt-3 max-w-3xl whitespace-pre-line font-body leading-relaxed text-muted">
          {video.description}
        </p>
      )}

      <ContentEngagement type="video" id={video.id} path={`/videos/${video.id}`} />
    </article>
  );
}
