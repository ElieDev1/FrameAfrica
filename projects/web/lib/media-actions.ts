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
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image to upload.' };
  }

  const token = await getAccessToken();
  if (!token) redirect('/login');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/cms/media`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: formData, // fetch sets the multipart boundary
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    let message = 'Upload failed.';
    try {
      const json = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(json.message)) message = json.message[0] ?? message;
      else if (json.message) message = json.message;
    } catch {
      // keep the default message
    }
    return { error: message };
  }

  const json = (await res.json()) as { data: { url: string } };
  revalidatePath('/dashboard/media');
  return { uploadedUrl: json.data.url };
}
