'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { HOUSE_ADS_TAG } from './ads';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/**
 * Publish a Studio-designed creative as a live house ad: upload the exported
 * PNG to the media library, then create the ad pointing at it.
 */
export async function publishAdCreative(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Your session expired — sign in again.' };

  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim();
  const linkUrl = String(formData.get('linkUrl') ?? '').trim();
  const placement = String(formData.get('placement') ?? 'leaderboard');

  if (!(file instanceof File)) return { ok: false, error: 'The creative failed to export.' };
  if (!title || !linkUrl) return { ok: false, error: 'Add a title and a destination link.' };

  try {
    // 1. Upload the PNG to the media library.
    const upload = new FormData();
    upload.append('file', file, 'ad-creative.png');
    upload.append('alt', title);
    upload.append('credit', 'Frame Africa Studio');
    const uploadRes = await fetch(`${API_URL}/cms/media`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: upload,
      cache: 'no-store',
    });
    if (!uploadRes.ok) return { ok: false, error: 'Could not upload the creative.' };
    const uploaded = (await uploadRes.json()) as { data: { url: string } };

    // 2. Create the house ad that serves it.
    const adRes = await fetch(`${API_URL}/admin/ads`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title, linkUrl, imageUrl: uploaded.data.url, placement }),
      cache: 'no-store',
    });
    if (adRes.status === 400) return { ok: false, error: 'Use a full https:// destination link.' };
    if (!adRes.ok) return { ok: false, error: 'Could not create the house ad.' };

    revalidateTag(HOUSE_ADS_TAG, 'max');
    revalidatePath('/dashboard/ads');
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}
