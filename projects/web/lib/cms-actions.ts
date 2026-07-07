'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface DraftFormState {
  error?: string;
  savedAt?: string;
}

async function authedFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message[0] ?? fallback;
    return json.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Parse the block-editor's serialised JSON into an array (empty on any error). */
function parseBlocks(formData: FormData): unknown[] {
  try {
    const value: unknown = JSON.parse(String(formData.get('blocks') ?? '[]'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function draftPayload(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    categoryId: String(formData.get('categoryId') ?? ''),
    subtitle: String(formData.get('subtitle') ?? '').trim() || undefined,
    excerpt: String(formData.get('excerpt') ?? '').trim() || undefined,
    // The structured document authored in the block editor; the API derives the
    // plain body from it and sanitises every block on write.
    blocks: parseBlocks(formData),
    // Selected topic slugs (checkbox group); the API replaces the tag set.
    topics: formData.getAll('topics').map(String),
    language: String(formData.get('language') || 'en'),
    isPremium: formData.get('isPremium') === 'on',
    featuredImageUrl: String(formData.get('featuredImageUrl') ?? '').trim() || undefined,
    featuredImageAlt: String(formData.get('featuredImageAlt') ?? '').trim() || undefined,
    featuredImageCredit: String(formData.get('featuredImageCredit') ?? '').trim() || undefined,
  };
}

export async function createDraftAction(
  _prev: DraftFormState,
  formData: FormData,
): Promise<DraftFormState> {
  const payload = draftPayload(formData);
  if (payload.title.length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!payload.categoryId) return { error: 'Please choose a section.' };

  let res: Response;
  try {
    res = await authedFetch('/cms/articles', 'POST', payload);
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await errorMessage(res, 'Could not create the draft.') };

  const json = (await res.json()) as { data: { id: string } };
  redirect(`/dashboard/stories/${json.data.id}`);
}

export async function updateDraftAction(
  id: string,
  _prev: DraftFormState,
  formData: FormData,
): Promise<DraftFormState> {
  const payload = {
    ...draftPayload(formData),
    changeNote: String(formData.get('changeNote') ?? '').trim() || undefined,
  };
  if (payload.title.length < 3) return { error: 'Title must be at least 3 characters.' };

  let res: Response;
  try {
    res = await authedFetch(`/cms/articles/${id}`, 'PATCH', payload);
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await errorMessage(res, 'Could not save the draft.') };

  revalidatePath(`/dashboard/stories/${id}`);
  revalidatePath('/dashboard/stories');
  return { savedAt: new Date().toISOString() };
}

export async function submitDraftAction(id: string): Promise<void> {
  const res = await authedFetch(`/cms/articles/${id}/submit`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not submit the draft for review.');
  redirect('/dashboard/stories');
}

export async function publishAction(id: string): Promise<void> {
  const res = await authedFetch(`/cms/articles/${id}/publish`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not publish the article.');
  revalidatePath('/dashboard/review');
  revalidatePath('/');
  redirect('/dashboard/review');
}

export async function rejectAction(id: string): Promise<void> {
  const res = await authedFetch(`/cms/articles/${id}/reject`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not reject the article.');
  revalidatePath('/dashboard/review');
  redirect('/dashboard/review');
}
