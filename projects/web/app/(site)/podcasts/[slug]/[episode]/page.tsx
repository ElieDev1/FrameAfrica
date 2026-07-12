import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentEngagement } from '@/components/ContentEngagement';
import { EpisodePlayer } from '@/components/EpisodePlayer';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchPodcastShow } from '@/lib/podcasts';

export const revalidate = 300;

type Params = Promise<{ slug: string; episode: string }>;

/** The show already ships its episodes, so no extra endpoint is needed. */
async function load(params: Params) {
  const { slug, episode } = await params;
  const show = await fetchPodcastShow(slug);
  const ep = show?.episodes.find((e) => e.slug === episode) ?? null;
  return { show, ep };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { show, ep } = await load(params);
  if (!show || !ep) return { title: 'Episode not found' };
  return {
    title: `${ep.title} — ${show.title}`,
    description: ep.description ?? show.description ?? undefined,
  };
}

export default async function EpisodePage({ params }: { params: Params }) {
  const [{ show, ep }, locale] = await Promise.all([load(params), getLocale()]);
  if (!show || !ep) notFound();

  return (
    <article className="mx-auto max-w-[1100px] px-6 py-8">
      <Link
        href={`/podcasts/${show.slug}`}
        className="font-mono text-xs text-primary hover:underline"
      >
        ← {show.title}
      </Link>

      <header className="mt-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-faint">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted">
            {ep.mediaKind}
          </span>
          {ep.episodeNo != null && (
            <span>
              {t(locale, 'pod.ep')} {ep.episodeNo}
            </span>
          )}
          {ep.publishedAt && <span>{formatDate(ep.publishedAt)}</span>}
        </div>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {ep.title}
        </h1>
      </header>

      <div className="pt-8">
        <EpisodePlayer episode={ep} coverFallback={show.coverUrl} />
      </div>

      {ep.description && (
        <p className="mt-4 max-w-3xl whitespace-pre-line font-body leading-relaxed text-muted">
          {ep.description}
        </p>
      )}

      <ContentEngagement type="episode" id={ep.id} path={`/podcasts/${show.slug}/${ep.slug}`} />
    </article>
  );
}
