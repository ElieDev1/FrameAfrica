'use server';

import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface LikeState {
  liked: boolean;
  likeCount: number;
}

/**
 * The current reader's like state for an article, via the BFF (the access token
 * stays server-side). Returns null when signed out.
 */
export async function getLikeStatus(articleId: string): Promise<LikeState | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/articles/${articleId}/like`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: LikeState };
    return json.data;
  } catch {
    return null;
  }
}

/** Like or unlike an article; returns the new state (throws if signed out). */
export async function toggleLike(articleId: string, like: boolean): Promise<LikeState> {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to like this story.');
  const res = await fetch(`${API_URL}/articles/${articleId}/like`, {
    method: like ? 'POST' : 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not update your like.');
  const json = (await res.json()) as { data: LikeState };
  return json.data;
}
