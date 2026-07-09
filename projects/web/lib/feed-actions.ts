'use server';

import type { ArticleSummary } from './api';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface FeedPage {
  articles: ArticleSummary[];
  nextCursor: string | null;
  personalized: boolean;
}

const EMPTY: FeedPage = { articles: [], nextCursor: null, personalized: false };

/**
 * The signed-in reader's personalised "For You" feed (cursor-paginated). Used
 * for the first page and "load more". Returns an empty page when signed out.
 */
export async function fetchFeed(
  params: { cursor?: string; limit?: number } = {},
): Promise<FeedPage> {
  const token = await getAccessToken();
  if (!token) return EMPTY;

  const search = new URLSearchParams();
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  const query = search.toString();

  try {
    const res = await fetch(`${API_URL}/me/feed${query ? `?${query}` : ''}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return EMPTY;
    const json = (await res.json()) as {
      data: ArticleSummary[];
      meta: { pagination?: { nextCursor: string | null }; personalized?: boolean };
    };
    return {
      articles: json.data,
      nextCursor: json.meta.pagination?.nextCursor ?? null,
      personalized: Boolean(json.meta.personalized),
    };
  } catch {
    return EMPTY;
  }
}
