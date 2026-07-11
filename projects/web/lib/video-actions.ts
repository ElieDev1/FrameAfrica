'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function authHeader(): Promise<Record<string, string> | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

function refresh() {
  revalidatePath('/dashboard/videos');
  revalidatePath('/videos');
  revalidatePath('/', 'layout'); // homepage Watch strip
}

/** Trigger a YouTube channel sync. Returns how many clips were pulled. */
export async function syncVideos(): Promise<{ synced?: number; reason?: string; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired — sign in again.' };
  try {
    const res = await fetch(`${API_URL}/admin/videos/sync`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Sync failed.' };
    const json = (await res.json()) as { data: { synced: number; reason?: string } };
    refresh();
    return { synced: json.data.synced, reason: json.data.reason };
  } catch {
    return { error: 'Could not reach the server.' };
  }
}

export interface AddVideoState {
  error?: string;
  added?: string;
}

/** Curate a clip into the hub by URL. */
export async function addVideo(_prev: AddVideoState, formData: FormData): Promise<AddVideoState> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired — sign in again.' };

  const url = String(formData.get('url') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  if (url.length < 5) return { error: 'Paste a YouTube URL.' };

  try {
    const res = await fetch(`${API_URL}/admin/videos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, title: title || undefined }),
      cache: 'no-store',
    });
    if (res.status === 400) {
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      return { error: json?.message ?? 'Not a valid YouTube URL.' };
    }
    if (!res.ok) return { error: 'Could not add the video.' };
    const json = (await res.json()) as { data: { title: string } };
    refresh();
    return { added: json.data.title };
  } catch {
    return { error: 'Could not reach the server.' };
  }
}

/** Feature/hide a clip. */
export async function setVideoFlags(
  id: string,
  flags: { isFeatured?: boolean; isHidden?: boolean },
): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/videos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(flags),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not update the video.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  refresh();
  return {};
}

/** Remove a clip from the hub. */
export async function deleteVideo(id: string): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/videos/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not delete the video.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  refresh();
  return {};
}
