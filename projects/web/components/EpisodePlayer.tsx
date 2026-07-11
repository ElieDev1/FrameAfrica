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

/** Renders an episode's media: YouTube embed, self-hosted video, or audio. */
export function EpisodePlayer({ episode }: { episode: PublicEpisode }) {
  if (episode.mediaKind === 'video') {
    const yt = youtubeId(episode.mediaUrl);
    if (yt) {
      return <VideoEmbed youtubeId={yt} title={episode.title} thumbnailUrl={episode.coverUrl} />;
    }
    return (
      <video
        controls
        preload="metadata"
        poster={episode.coverUrl ?? undefined}
        src={episode.mediaUrl}
        className="aspect-video w-full rounded-xl bg-black ring-1 ring-border"
      />
    );
  }
  return <audio controls preload="none" src={episode.mediaUrl} className="w-full" />;
}
