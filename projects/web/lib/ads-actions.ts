'use server';

import { revalidatePath } from 'next/cache';
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
  const res = await authed('/admin/ads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 400) return { ok: false, error: 'Check the title and a valid https link.' };
  if (!res.ok) return { ok: false, error: 'Could not create the ad.' };
  revalidatePath('/dashboard/ads');
  return { ok: true };
}

export async function toggleHouseAd(id: string, isActive: boolean): Promise<void> {
  await authed(`/admin/ads/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  revalidatePath('/dashboard/ads');
}

export async function deleteHouseAd(id: string): Promise<void> {
  await authed(`/admin/ads/${id}`, { method: 'DELETE' });
  revalidatePath('/dashboard/ads');
}
