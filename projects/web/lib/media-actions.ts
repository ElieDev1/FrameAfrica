'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { MediaAsset } from './cms';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface UploadState {
  error?: string;
  uploadedUrl?: string;
  /** How many files landed in this batch (the picker is `multiple`). */
  uploadedCount?: number;
}

/** Upload an audio/video file (podcasts, self-hosted clips) → its public URL. */
export async function uploadAVAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' };

  const token = await getAccessToken();
  if (!token) return { error: 'Session expired — sign in again.' };

  try {
    const res = await fetch(`${API_URL}/cms/media/av`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: formData,
      cache: 'no-store',
    });
    if (!res.ok) {
      let message = 'Upload failed.';
      try {
        const json = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(json.message)) message = json.message[0] ?? message;
        else if (json.message) message = json.message;
      } catch {
        // keep default
      }
      return { error: message };
    }
    const json = (await res.json()) as { data: { url: string } };
    return { url: json.data.url };
  } catch {
    return { error: 'Could not reach the server.' };
  }
}

/** Fetch the media library for the client-side picker (empty on any error). */
export async function listMediaAction(): Promise<MediaAsset[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/cms/media`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: MediaAsset[] };
    return json.data;
  } catch {
    return [];
  }
}

/**
 * BFF upload: takes the browser's multipart form (file + alt/credit), attaches
 * the session's access token, and forwards it to the API's media endpoint. The
 * browser never sees the token (documents/05 §3.2, §7).
 */
export async function uploadMediaAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  // A whole shoot at once: the picker is `multiple`, so take every file.
  const files = formData.getAll('file').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: 'Choose at least one file to upload.' };
  }

  const token = await getAccessToken();
  if (!token) redirect('/login');

  // Shared metadata for the batch — the album, plus optional alt/credit.
  const albumId = String(formData.get('albumId') ?? '');
  const alt = String(formData.get('alt') ?? '');
  const credit = String(formData.get('credit') ?? '');

  let uploaded = 0;
  let lastUrl: string | undefined;
  const failures: string[] = [];

  // The API takes one file per request, so post them in turn. Sequential keeps
  // memory flat and gives a truthful per-file error.
  for (const file of files) {
    const body = new FormData();
    body.set('file', file);
    if (albumId) body.set('albumId', albumId);
    // Alt/credit only make sense when a single file is being described.
    if (files.length === 1) {
      if (alt) body.set('alt', alt);
      if (credit) body.set('credit', credit);
    } else if (credit) {
      body.set('credit', credit); // a shoot usually shares one credit
    }

    // One library, any file: images to the image endpoint, audio/video to the
    // AV endpoint (bigger size limit).
    const endpoint = file.type.startsWith('image/') ? '/cms/media' : '/cms/media/av';

    let res: Response;
    try {
      res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body, // fetch sets the multipart boundary
        cache: 'no-store',
      });
    } catch {
      failures.push(`${file.name}: could not reach the server`);
      continue;
    }

    if (res.status === 401) redirect('/login');
    if (!res.ok) {
      let message = 'upload failed';
      try {
        const json = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(json.message)) message = json.message[0] ?? message;
        else if (json.message) message = json.message;
      } catch {
        // keep the default message
      }
      failures.push(`${file.name}: ${message}`);
      continue;
    }

    const json = (await res.json()) as { data: { url: string } };
    lastUrl = json.data.url;
    uploaded += 1;
  }

  revalidatePath('/dashboard/media');

  // Partial success is normal in a batch (one odd file among fifty) — report
  // both sides rather than throwing the whole upload away.
  return {
    ...(uploaded > 0 ? { uploadedUrl: lastUrl, uploadedCount: uploaded } : {}),
    ...(failures.length > 0
      ? { error: failures.slice(0, 3).join(' · ') + (failures.length > 3 ? ' …' : '') }
      : {}),
  };
}

/** Delete a media asset from the library (editor/admin). */
export async function deleteMediaAction(id: string): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  try {
    const res = await fetch(`${API_URL}/cms/media/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) redirect('/login');
    if (res.status === 403) return { error: 'Only editors and admins can delete media.' };
    if (!res.ok) return { error: 'Could not delete this image.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/media');
  return {};
}

// ── Albums ──────────────────────────────────────────────────────────────────

/** Authenticated JSON call to the media API (BFF — the token stays server-side). */
async function mediaFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}/cms/media${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
}

/** Create an event album (any staffer; photographers own this workflow). */
export async function createAlbumAction(input: {
  name: string;
  description?: string;
  eventDate?: string;
}): Promise<{ error?: string }> {
  if (!input.name.trim()) return { error: 'Give the album a name.' };
  try {
    const res = await mediaFetch('/albums', 'POST', {
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      // The API wants a full ISO timestamp, the form gives a date.
      ...(input.eventDate ? { eventDate: new Date(input.eventDate).toISOString() } : {}),
    });
    if (res.status === 401) redirect('/login');
    if (!res.ok) return { error: 'Could not create the album.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/media');
  return {};
}

/** Rename / re-date an album. */
export async function updateAlbumAction(
  id: string,
  input: { name?: string; description?: string; eventDate?: string },
): Promise<{ error?: string }> {
  try {
    const res = await mediaFetch(`/albums/${id}`, 'PATCH', {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.eventDate ? { eventDate: new Date(input.eventDate).toISOString() } : {}),
    });
    if (res.status === 401) redirect('/login');
    if (!res.ok) return { error: 'Could not update the album.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/media');
  return {};
}

/** Delete an album. Its files are unfiled, never deleted. */
export async function deleteAlbumAction(id: string): Promise<{ error?: string }> {
  try {
    const res = await mediaFetch(`/albums/${id}`, 'DELETE');
    if (res.status === 401) redirect('/login');
    if (res.status === 403) return { error: 'Only photographers, editors and admins can do that.' };
    if (!res.ok) return { error: 'Could not delete the album.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/media');
  return {};
}

/** File a photo/clip into an album, or pass null to unfile it. */
export async function moveAssetAction(
  id: string,
  albumId: string | null,
): Promise<{ error?: string }> {
  try {
    const res = await mediaFetch(`/${id}/album`, 'PATCH', { albumId });
    if (res.status === 401) redirect('/login');
    if (!res.ok) return { error: 'Could not move this file.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/media');
  return {};
}
