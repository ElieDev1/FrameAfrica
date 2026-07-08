'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchLiveUpdates, type LiveUpdate } from './api';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Poll target for the live feed (public, newest first). */
export async function pollLiveUpdates(slug: string): Promise<LiveUpdate[]> {
  return fetchLiveUpdates(slug);
}

export interface LiveComposeState {
  error?: string;
  postedAt?: string;
}

async function authed(path: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

/** Staff: post a live update to an article. */
export async function addLiveUpdateAction(
  articleId: string,
  slug: string,
  _prev: LiveComposeState,
  formData: FormData,
): Promise<LiveComposeState> {
  const body = String(formData.get('body') ?? '').trim();
  if (body.length < 1) return { error: 'Write an update first.' };
  const payload = {
    body,
    headline: String(formData.get('headline') ?? '').trim() || undefined,
    isKeyEvent: formData.get('isKeyEvent') === 'on',
  };

  let res: Response;
  try {
    res = await authed(`/cms/articles/${articleId}/live`, payload);
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not post the update.' };

  revalidatePath(`/article/${slug}`);
  return { postedAt: new Date().toISOString() };
}

/** Staff: end live coverage. */
export async function endLiveAction(articleId: string, slug: string): Promise<void> {
  const res = await authed(`/cms/articles/${articleId}/live/end`);
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not end live coverage.');
  revalidatePath(`/article/${slug}`);
}
