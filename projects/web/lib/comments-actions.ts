'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface CommentFormState {
  error?: string;
  ok?: boolean;
}

/** Post a comment on an article (BFF — the access token stays server-side). */
export async function postComment(
  articleId: string,
  slug: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return { error: 'Write something first.' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (res.status === 401) redirect('/login');
  if (res.status === 429) return { error: 'You’re commenting too fast — please wait a moment.' };
  if (!res.ok) return { error: 'Could not post your comment.' };

  revalidatePath(`/article/${slug}`);
  return { ok: true };
}
