import type { Metadata } from 'next';
import { VideoHub } from '@/components/VideoHub';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchVideos } from '@/lib/videos';

export const metadata: Metadata = {
  title: 'Video',
  description: 'Watch Frame Africa — reporting, explainers and interviews.',
};

export const revalidate = 300;

export default async function VideosPage() {
  const [videos, locale] = await Promise.all([fetchVideos(24), getLocale()]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'home.watch')}
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'mm.videos')}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">{t(locale, 'mm.videosSub')}</p>
      </header>

      {videos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10">
          <p className="font-heading text-lg font-bold text-text">{t(locale, 'mm.empty')}</p>
          <p className="mt-1 font-body text-sm text-muted">{t(locale, 'mm.emptyHint')}</p>
        </div>
      ) : (
        <VideoHub videos={videos} />
      )}
    </div>
  );
}
