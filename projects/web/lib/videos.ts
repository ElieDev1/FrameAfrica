const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
}

/** Cached YouTube uploads (empty when the channel isn't configured yet). */
export async function fetchVideos(limit = 12): Promise<VideoItem[]> {
  try {
    const res = await fetch(`${API_URL}/videos?limit=${limit}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VideoItem[] };
    return json.data;
  } catch {
    return [];
  }
}
