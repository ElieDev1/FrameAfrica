'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { HOUSE_ADS_TAG } from './ads';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function authed(path: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authorised');
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

export async function createHouseAd(data: {
  title: string;
  linkUrl: string;
  imageUrl?: string;
  placement: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) return { ok: false, error: 'Your session expired — sign in again.' };
    const res = await fetch(`${API_URL}/admin/ads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (res.status === 400) return { ok: false, error: 'Check the title and a valid https link.' };
    if (!res.ok) return { ok: false, error: `Could not create the ad (${res.status}).` };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
  revalidateTag(HOUSE_ADS_TAG, 'max'); // purge the tagged ad fetch across the site
  revalidatePath('/dashboard/ads');
  revalidatePath('/', 'layout'); // make it appear on the public site immediately
  return { ok: true };
}

export async function toggleHouseAd(id: string, isActive: boolean): Promise<void> {
  await authed(`/admin/ads/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  revalidateTag(HOUSE_ADS_TAG, 'max');
  revalidatePath('/dashboard/ads');
  revalidatePath('/', 'layout');
}

export async function deleteHouseAd(id: string): Promise<void> {
  await authed(`/admin/ads/${id}`, { method: 'DELETE' });
  revalidateTag(HOUSE_ADS_TAG, 'max');
  revalidatePath('/dashboard/ads');
  revalidatePath('/', 'layout');
}
