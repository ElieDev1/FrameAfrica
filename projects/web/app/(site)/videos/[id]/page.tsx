import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VideoHub } from '@/components/VideoHub';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchVideo, fetchVideos } from '@/lib/videos';

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
  const [video, all, locale] = await Promise.all([fetchVideo(id), fetchVideos(24), getLocale()]);
  if (!video) notFound();

  // Reuse the hub so the watch page has the same stage + "Up next" rail + grid,
  // just focused on the clicked clip. Guarantee it's in the list (it may sit
  // beyond the fetch limit).
  const videos = all.some((v) => v.id === id) ? all : [video, ...all];

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <Link href="/videos" className="font-mono text-xs text-primary hover:underline">
        ← {t(locale, 'mm.videos')}
      </Link>
      {/* Keyed on id so navigating between clips re-initialises the stage. */}
      <VideoHub key={id} videos={videos} initialId={id} />
    </div>
  );
}
