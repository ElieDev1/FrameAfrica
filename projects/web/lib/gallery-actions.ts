'use server';

import { revalidatePath } from 'next/cache';
import type { GalleryImage } from './cms';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function authHeader(): Promise<Record<string, string> | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

export interface GalleryInput {
  title: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  images: GalleryImage[];
}

function refresh(slug?: string) {
  revalidatePath('/dashboard/galleries');
  revalidatePath('/galleries');
  if (slug) revalidatePath(`/galleries/${slug}`);
}

/** Create a gallery draft. Returns its id on success. */
export async function createGallery(input: GalleryInput): Promise<{ id?: string; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired — sign in again.' };
  try {
    const res = await fetch(`${API_URL}/admin/galleries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not create the gallery.' };
    const json = (await res.json()) as { data: { id: string } };
    refresh();
    return { id: json.data.id };
  } catch {
    return { error: 'Could not reach the server.' };
  }
}

/** Update a gallery's fields and/or images. */
export async function updateGallery(
  id: string,
  input: Partial<GalleryInput>,
): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/galleries/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not save the gallery.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  refresh();
  return {};
}

/** Publish / unpublish a gallery. */
export async function setGalleryStatus(
  id: string,
  status: 'draft' | 'published',
  slug?: string,
): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/galleries/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not update the gallery.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  refresh(slug);
  return {};
}

/** Delete (soft) a gallery. */
export async function deleteGallery(id: string): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/galleries/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not delete the gallery.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  refresh();
  return {};
}
