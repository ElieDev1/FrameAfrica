'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function adminFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}/admin/taxonomy${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function message(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.json()) as { error?: { message?: string } };
    return json.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

type Result = { error?: string };

function done(): Result {
  revalidatePath('/dashboard/taxonomy');
  return {};
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(input: {
  name: string;
  parentId?: string;
  description?: string;
}): Promise<Result> {
  if (!input.name.trim()) return { error: 'Name is required.' };
  const res = await adminFetch('/categories', 'POST', {
    name: input.name.trim(),
    parentId: input.parentId || undefined,
    description: input.description?.trim() || undefined,
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not create the section.') };
  return done();
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    isActive?: boolean;
  },
): Promise<Result> {
  const res = await adminFetch(`/categories/${id}`, 'PATCH', input);
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not update the section.') };
  return done();
}

export async function deleteCategory(id: string): Promise<Result> {
  const res = await adminFetch(`/categories/${id}`, 'DELETE');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not delete the section.') };
  return done();
}

// ── Topics ───────────────────────────────────────────────────────────────────

export async function createTopic(input: { name: string; description?: string }): Promise<Result> {
  if (!input.name.trim()) return { error: 'Name is required.' };
  const res = await adminFetch('/topics', 'POST', {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not create the topic.') };
  return done();
}

export async function updateTopic(
  id: string,
  input: { name?: string; description?: string | null; isActive?: boolean },
): Promise<Result> {
  const res = await adminFetch(`/topics/${id}`, 'PATCH', input);
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not update the topic.') };
  return done();
}

export async function deleteTopic(id: string): Promise<Result> {
  const res = await adminFetch(`/topics/${id}`, 'DELETE');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await message(res, 'Could not delete the topic.') };
  return done();
}
