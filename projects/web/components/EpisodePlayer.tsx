import { ActivityIcon } from '@/components/icons';
import { VideoEmbed } from '@/components/VideoEmbed';
import type { PublicEpisode } from '@/lib/podcasts';

/** Extract an 11-char YouTube id from a watch/youtu.be/embed/shorts URL. */
function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return clip(url.pathname.slice(1));
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') return clip(url.searchParams.get('v') ?? '');
      if (url.pathname.startsWith('/embed/')) return clip(url.pathname.slice(7));
      if (url.pathname.startsWith('/shorts/')) return clip(url.pathname.slice(8));
    }
  } catch {
    return null;
  }
  return null;
}
function clip(id: string): string | null {
  const s = id.split('/')[0];
  return /^[\w-]{11}$/.test(s) ? s : null;
}

/**
 * Renders an episode's media: YouTube embed, self-hosted video, or audio. An
 * episode rarely carries its own cover, so the show's artwork is passed in as a
 * fallback poster — otherwise the player would render an empty placeholder.
 */
export function EpisodePlayer({
  episode,
  coverFallback = null,
}: {
  episode: PublicEpisode;
  coverFallback?: string | null;
}) {
  const cover = episode.coverUrl ?? coverFallback;

  if (episode.mediaKind === 'video') {
    const yt = youtubeId(episode.mediaUrl);
    if (yt) {
      // VideoEmbed derives YouTube's own thumbnail when there's no cover.
      return <VideoEmbed youtubeId={yt} title={episode.title} thumbnailUrl={episode.coverUrl} />;
    }
    return (
      <video
        controls
        preload="metadata"
        poster={cover ?? undefined}
        src={episode.mediaUrl}
        className="aspect-video w-full rounded-xl bg-black ring-1 ring-border"
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-primary ring-1 ring-border">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary host
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <ActivityIcon size={18} />
        )}
      </span>
      <audio controls preload="none" src={episode.mediaUrl} className="min-w-0 flex-1" />
    </div>
  );
}
