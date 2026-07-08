'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function adminFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}/admin/settings/integrations${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

/** Set/update an integration value. `key` is UPPER_SNAKE_CASE. */
export async function setIntegration(key: string, value: string): Promise<{ error?: string }> {
  if (!value.trim()) return { error: 'Enter a value.' };
  const res = await adminFetch(`/${encodeURIComponent(key)}`, 'PUT', { value });
  if (res.status === 401) redirect('/login');
  if (res.status === 400) return { error: 'Invalid key — use UPPER_SNAKE_CASE.' };
  if (!res.ok) return { error: 'Could not save.' };
  revalidatePath('/dashboard/settings');
  return {};
}

/** Remove a stored integration value. */
export async function removeIntegration(key: string): Promise<{ error?: string }> {
  const res = await adminFetch(`/${encodeURIComponent(key)}`, 'DELETE');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not remove.' };
  revalidatePath('/dashboard/settings');
  return {};
}
