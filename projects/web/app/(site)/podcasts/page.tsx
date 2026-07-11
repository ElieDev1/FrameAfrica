import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchPodcastShows } from '@/lib/podcasts';

export const metadata: Metadata = {
  title: 'Podcasts',
  description: 'Listen and watch — audio and video podcasts from Frame Africa.',
};

export const revalidate = 300;

export default async function PodcastsPage() {
  const [shows, locale] = await Promise.all([fetchPodcastShows(), getLocale()]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'mm.podcasts')}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">{t(locale, 'mm.podcastsSub')}</p>
      </header>

      {shows.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'mm.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((s) => (
            <Link key={s.id} href={`/podcasts/${s.slug}`} className="group flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {s.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-bold leading-snug text-text group-hover:text-primary">
                  {s.title}
                </h2>
                {s.description && (
                  <p className="mt-1 line-clamp-2 font-body text-sm text-muted">{s.description}</p>
                )}
                <span className="mt-2 block font-mono text-[11px] text-faint">
                  {s.episodeCount} episode{s.episodeCount === 1 ? '' : 's'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
