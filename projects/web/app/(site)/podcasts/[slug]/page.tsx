import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EpisodePlayer } from '@/components/EpisodePlayer';
import { ActivityIcon } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
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
  const [show, locale] = await Promise.all([fetchPodcastShow(slug), getLocale()]);
  if (!show) notFound();

  const links = subLinks(show);
  const count = show.episodes.length;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* ── Show rail (sticky on desktop) ───────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border">
          {show.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-faint">
              <ActivityIcon size={40} />
            </span>
          )}
        </div>

        <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'pod.kicker')}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-black leading-tight tracking-tight text-text">
          {show.title}
        </h1>
        <p className="mt-2 font-mono text-[11px] text-faint">
          {count} {t(locale, count === 1 ? 'pod.episode' : 'pod.episodes').toLowerCase()}
        </p>
        {show.description && (
          <p className="mt-3 font-body text-sm leading-relaxed text-muted">{show.description}</p>
        )}

        {links.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {t(locale, 'pod.listenOn')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
        )}
      </aside>

      {/* ── Episodes ────────────────────────────────────────────────── */}
      <main className="min-w-0">
        <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
          <h2 className="flex items-center gap-2.5 font-heading text-lg font-black uppercase tracking-tight text-text">
            <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
            {t(locale, 'pod.episodes')}
          </h2>
          <span className="font-mono text-[11px] text-faint">{count}</span>
        </div>

        {count === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-10">
            <p className="font-heading text-lg font-bold text-text">
              {t(locale, 'pod.noEpisodes')}
            </p>
            <p className="mt-1 font-body text-sm text-muted">{t(locale, 'mm.emptyHint')}</p>
          </div>
        ) : (
          // Two-up on wide screens so a single video never dominates the page.
          <ul className="mt-6 grid gap-8 xl:grid-cols-2">
            {show.episodes.map((ep) => (
              <li key={ep.id} className="flex min-w-0 flex-col">
                <EpisodePlayer episode={ep} coverFallback={show.coverUrl} />
                <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-faint">
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
                <h3 className="mt-1 font-heading text-lg font-bold leading-snug text-text">
                  {ep.title}
                </h3>
                {ep.description && (
                  <p className="mt-1 line-clamp-3 font-body text-sm leading-relaxed text-muted">
                    {ep.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
