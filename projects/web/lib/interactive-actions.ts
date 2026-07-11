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

function refresh(slug?: string) {
  revalidatePath('/dashboard/interactives');
  revalidatePath('/interactives');
  if (slug) revalidatePath(`/interactives/${slug}`);
}

export interface InteractiveInput {
  title: string;
  embedUrl: string;
  description?: string;
  coverUrl?: string;
  source?: string;
  aspectRatio?: string;
}

async function send(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ data?: unknown; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: 'Session expired — sign in again.' };
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    if (res.status === 400) {
      const json = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      const msg = Array.isArray(json?.message) ? json?.message[0] : json?.message;
      return { error: msg ?? 'Invalid input.' };
    }
    if (!res.ok) return { error: 'Something went wrong.' };
    if (method === 'DELETE') return {};
    const json = (await res.json()) as { data: unknown };
    return { data: json.data };
  } catch {
    return { error: 'Could not reach the server.' };
  }
}

export async function createInteractive(
  input: InteractiveInput,
): Promise<{ id?: string; error?: string }> {
  const res = await send('/admin/interactives', 'POST', input);
  if (res.error) return { error: res.error };
  refresh();
  return { id: (res.data as { id: string }).id };
}

export async function updateInteractive(
  id: string,
  input: Partial<InteractiveInput> & { status?: 'draft' | 'published' },
  slug?: string,
): Promise<{ error?: string }> {
  const res = await send(`/admin/interactives/${id}`, 'PATCH', input);
  if (!res.error) refresh(slug);
  return res;
}

export async function deleteInteractive(id: string): Promise<{ error?: string }> {
  const res = await send(`/admin/interactives/${id}`, 'DELETE');
  if (!res.error) refresh();
  return res;
}
