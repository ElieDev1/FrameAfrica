'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Comment } from './api';
import {
  type EngagementCounts,
  type EngagementTarget,
  fetchContentComments,
  fetchEngagement,
} from './engagement';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Like / unlike any content. Signed-in only — bounces to login otherwise. */
export async function toggleLike(
  type: EngagementTarget,
  id: string,
  liked: boolean,
): Promise<EngagementCounts | null> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    const res = await fetch(`${API_URL}/engagement/${type}/${id}/like`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ liked }),
      cache: 'no-store',
    });
    if (res.status === 401) redirect('/login');
    if (!res.ok) return null;
    const json = (await res.json()) as { data: EngagementCounts };
    return json.data;
  } catch {
    return null;
  }
}

/**
 * Record a share. Deliberately anonymous — no token is sent and the API stores
 * no identity; we only count that a share happened.
 */
export async function recordShare(
  type: EngagementTarget,
  id: string,
): Promise<EngagementCounts | null> {
  try {
    const res = await fetch(`${API_URL}/engagement/${type}/${id}/share`, {
      method: 'POST',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: EngagementCounts };
    return json.data;
  } catch {
    return null;
  }
}

export interface InlineEngagement {
  counts: EngagementCounts;
  comments: Comment[];
  signedIn: boolean;
}

/**
 * Everything the inline engagement surface needs for one item, in a single
 * round-trip. Called from the client when the reader switches to a different
 * video (or after they post), so the like/share/comment strip and the thread
 * update in place — no page navigation.
 */
export async function loadEngagement(
  type: EngagementTarget,
  id: string,
): Promise<InlineEngagement> {
  const [counts, comments, token] = await Promise.all([
    fetchEngagement(type, id),
    fetchContentComments(type, id),
    getAccessToken(),
  ]);
  return { counts, comments, signedIn: Boolean(token) };
}

export interface CommentFormState {
  error?: string;
  ok?: boolean;
}

/** Post a comment on any content type (BFF — the access token stays server-side). */
export async function postContentComment(
  type: EngagementTarget,
  id: string,
  path: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return { error: 'Write something first.' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/comments/${type}/${id}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (res.status === 401) redirect('/login');
  if (res.status === 429) return { error: 'You’re commenting too fast — please wait a moment.' };
  if (!res.ok) return { error: 'Could not post your comment.' };

  revalidatePath(path);
  return { ok: true };
}
