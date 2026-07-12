import { pageQuery } from './paging';

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

/** One page of clips for the hub's pager. */
export async function fetchVideosPage(
  limit: number,
  page: number,
  q?: string,
): Promise<{ items: VideoItem[]; hasMore: boolean }> {
  try {
    const res = await fetch(`${API_URL}/videos?${pageQuery(limit, page, q)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { items: [], hasMore: false };
    const json = (await res.json()) as {
      data: VideoItem[];
      meta?: { pagination?: { hasMore: boolean } };
    };
    return { items: json.data, hasMore: Boolean(json.meta?.pagination?.hasMore) };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** One clip, for its own watch page. */
export async function fetchVideo(id: string): Promise<VideoItem | null> {
  try {
    const res = await fetch(`${API_URL}/videos/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: VideoItem };
    return json.data;
  } catch {
    return null;
  }
}
