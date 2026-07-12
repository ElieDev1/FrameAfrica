'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface CommentFormState {
  error?: string;
  ok?: boolean;
}

/** Post a comment on an article (BFF — the access token stays server-side). */
export async function postComment(
  articleId: string,
  slug: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return { error: 'Write something first.' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/articles/${articleId}/comments`, {
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

  revalidatePath(`/article/${slug}`);
  return { ok: true };
}

async function authed(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

export interface CommentLikeState {
  liked: boolean;
  likeCount: number;
}

/** Like / unlike a comment; returns the new state. */
export async function toggleCommentLike(id: string, like: boolean): Promise<CommentLikeState> {
  const res = await authed(`/comments/${id}/like`, like ? 'POST' : 'DELETE');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not update your like.');
  const json = (await res.json()) as { data: CommentLikeState };
  return json.data;
}

/** Report a comment for moderation. */
export async function reportComment(id: string): Promise<void> {
  const res = await authed(`/comments/${id}/report`, 'POST', {});
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not report this comment.');
}

export interface FlaggedComment {
  id: string;
  body: string;
  status: string;
  reportCount: number;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null; banned: boolean };
  /** What was commented on — an article, gallery, episode, interactive or video. */
  target: { type: string; title: string; url: string | null };
}

/** Moderator/admin: the moderation queue (empty on any error). */
export async function fetchModerationQueue(): Promise<FlaggedComment[]> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const res = await fetch(`${API_URL}/cms/moderation`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];
  const json = (await res.json()) as { data: FlaggedComment[] };
  return json.data;
}

/** Moderator/admin: keep / hide / remove a flagged comment. */
export async function moderateComment(
  id: string,
  action: 'keep' | 'hide' | 'remove',
): Promise<void> {
  const res = await authed(`/cms/comments/${id}/moderate`, 'POST', { action });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not moderate this comment.');
  revalidatePath('/dashboard/moderation');
}

/** Moderator/admin: permanently remove a comment (soft-delete). */
export async function deleteComment(id: string): Promise<void> {
  const res = await authed(`/cms/comments/${id}`, 'DELETE');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not delete this comment.');
  revalidatePath('/dashboard/moderation');
}

/** Moderator/admin: ban or unban a user from commenting. */
export async function setUserCommentBan(userId: string, banned: boolean): Promise<void> {
  const res = await authed(`/cms/users/${userId}/${banned ? 'ban' : 'unban'}`, 'POST', {});
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not update the ban.');
  revalidatePath('/dashboard/moderation');
}
