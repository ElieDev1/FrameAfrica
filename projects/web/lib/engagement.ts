import type { Comment } from '@/lib/api';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Anything a reader can like, share or comment on. */
export type EngagementTarget = 'article' | 'gallery' | 'episode' | 'interactive' | 'video';

export interface EngagementCounts {
  likeCount: number;
  shareCount: number;
  commentCount: number;
  liked: boolean;
}

const ZERO: EngagementCounts = { likeCount: 0, shareCount: 0, commentCount: 0, liked: false };

/**
 * Counts for a piece of content. Sends the reader's token when they have one so
 * the API can also report whether *they* liked it — the endpoint is public, so a
 * signed-out reader still gets the numbers.
 */
export async function fetchEngagement(
  type: EngagementTarget,
  id: string,
): Promise<EngagementCounts> {
  const token = await getAccessToken();
  try {
    const res = await fetch(`${API_URL}/engagement/${type}/${id}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    });
    if (!res.ok) return ZERO;
    const json = (await res.json()) as { data: EngagementCounts };
    return json.data;
  } catch {
    return ZERO;
  }
}

/** Visible comments on any content type, threaded. */
export async function fetchContentComments(type: EngagementTarget, id: string): Promise<Comment[]> {
  try {
    const res = await fetch(`${API_URL}/comments/${type}/${id}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Comment[] };
    return json.data;
  } catch {
    return [];
  }
}
