import type { Metadata } from 'next';
import { VideoEmbed } from '@/components/VideoEmbed';
import { formatDate } from '@/lib/format';
import { fetchVideos } from '@/lib/videos';

export const metadata: Metadata = {
  title: 'Video',
  description: 'Watch Frame Africa — reporting, explainers and interviews.',
};

export const revalidate = 300;

export default async function VideosPage() {
  const videos = await fetchVideos(24);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Watch</p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">Video</h1>
        <p className="mt-2 max-w-2xl font-body text-muted">
          Reporting, explainers and interviews from the Frame Africa newsroom.
        </p>
      </header>

      {videos.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">
          No videos yet. Once an editor connects the YouTube channel, uploads appear here
          automatically.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article key={video.id}>
              <VideoEmbed
                youtubeId={video.youtubeId}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
              />
              <h2 className="mt-2 font-heading text-base font-bold leading-snug text-text">
                {video.title}
              </h2>
              <span className="mt-1 block font-mono text-[11px] text-faint">
                {formatDate(video.publishedAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
