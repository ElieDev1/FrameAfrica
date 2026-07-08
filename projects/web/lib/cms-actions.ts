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

/** Admin: edit ANY article (any author/status) via the admin endpoint. */
export async function updateAnyArticleAction(
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
    res = await authedFetch(`/cms/admin/articles/${id}`, 'PATCH', payload);
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await errorMessage(res, 'Could not save the article.') };

  revalidatePath(`/dashboard/articles/${id}`);
  revalidatePath('/dashboard/articles');
  return { savedAt: new Date().toISOString() };
}

export async function publishAction(id: string): Promise<void> {
  const res = await authedFetch(`/cms/articles/${id}/publish`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not publish the article.');
  revalidatePath('/dashboard/review');
  revalidatePath('/');
  redirect('/dashboard/review');
}

export async function rejectAction(id: string, formData: FormData): Promise<void> {
  const note = String(formData.get('note') ?? '').trim();
  const res = await authedFetch(`/cms/articles/${id}/reject`, 'POST', note ? { note } : {});
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not reject the article.');
  revalidatePath('/dashboard/review');
  redirect('/dashboard/review');
}

/** Pin/unpin a published article to the homepage (editor curation). */
export async function featureAction(id: string, featured: boolean): Promise<void> {
  const res = await authedFetch(`/cms/articles/${id}/feature`, 'POST', { featured });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Could not update the homepage feature.');
  revalidatePath('/');
  revalidatePath(`/dashboard/stories/${id}`);
}

export interface CorrectionState {
  error?: string;
  savedAt?: string;
}

/** Append a public, dated correction to a published article (editor-only). */
export async function addCorrectionAction(
  id: string,
  _prev: CorrectionState,
  formData: FormData,
): Promise<CorrectionState> {
  const note = String(formData.get('note') ?? '').trim();
  if (note.length < 3) return { error: 'Write a short correction note (at least 3 characters).' };

  let res: Response;
  try {
    res = await authedFetch(`/cms/articles/${id}/corrections`, 'POST', { note });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await errorMessage(res, 'Could not add the correction.') };

  revalidatePath(`/dashboard/stories/${id}`);
  return { savedAt: new Date().toISOString() };
}
