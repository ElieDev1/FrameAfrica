import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EpisodePlayer } from '@/components/EpisodePlayer';
import { formatDate } from '@/lib/format';
import { fetchPodcastShow } from '@/lib/podcasts';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const show = await fetchPodcastShow(slug);
  if (!show) return { title: 'Show not found' };
  return { title: show.title, description: show.description ?? undefined };
}

function subLinks(show: {
  spotifyUrl: string | null;
  appleUrl: string | null;
  rssUrl: string | null;
}) {
  return [
    { label: 'Spotify', href: show.spotifyUrl },
    { label: 'Apple', href: show.appleUrl },
    { label: 'RSS', href: show.rssUrl },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await fetchPodcastShow(slug);
  if (!show) notFound();

  const links = subLinks(show);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {show.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Podcast</p>
          <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
            {show.title}
          </h1>
          {show.description && (
            <p className="mt-2 max-w-2xl font-body text-muted">{show.description}</p>
          )}
          {links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {show.episodes.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">No episodes yet.</p>
      ) : (
        <ul className="flex flex-col gap-8 pt-8">
          {show.episodes.map((ep) => (
            <li key={ep.id} className="border-b border-border pb-8 last:border-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-muted">
                  {ep.mediaKind}
                </span>
                {ep.episodeNo != null && (
                  <span className="font-mono text-[11px] text-faint">Ep {ep.episodeNo}</span>
                )}
                {ep.publishedAt && (
                  <span className="font-mono text-[11px] text-faint">
                    {formatDate(ep.publishedAt)}
                  </span>
                )}
              </div>
              <h2 className="mb-3 font-heading text-xl font-bold text-text">{ep.title}</h2>
              <EpisodePlayer episode={ep} />
              {ep.description && (
                <p className="mt-3 font-body text-sm text-muted">{ep.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
