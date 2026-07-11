const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface PublicEpisode {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  mediaKind: 'audio' | 'video';
  mediaUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  episodeNo: number | null;
  publishedAt: string | null;
}

export interface PublicShowCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  rssUrl: string | null;
  episodeCount: number;
}

export interface PublicShow extends PublicShowCard {
  episodes: PublicEpisode[];
}

/** Published podcast shows, or [] on any error. */
export async function fetchPodcastShows(): Promise<PublicShowCard[]> {
  try {
    const res = await fetch(`${API_URL}/podcasts`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PublicShowCard[] };
    return json.data;
  } catch {
    return [];
  }
}

/** A single published show + its episodes, or null if missing. */
export async function fetchPodcastShow(slug: string): Promise<PublicShow | null> {
  try {
    const res = await fetch(`${API_URL}/podcasts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicShow };
    return json.data;
  } catch {
    return null;
  }
}
