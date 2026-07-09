'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface HistoryArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  viewedAt: string;
  category: { name: string; slug: string };
  featuredImage: { url: string; alt: string | null } | null;
}

/**
 * Record that the signed-in reader viewed an article. Fire-and-forget: never
 * throws, so it can't break article rendering; a no-op when signed out.
 */
export async function recordView(articleId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  try {
    await fetch(`${API_URL}/me/history/${articleId}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    // Reading history is best-effort; ignore failures.
  }
}

/** The reader's recently read articles (for the account page); [] when signed out. */
export async function fetchHistory(): Promise<HistoryArticle[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/me/history`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: HistoryArticle[] };
    return json.data;
  } catch {
    return [];
  }
}

/** Clear the reader's entire reading history. */
export async function clearHistory(): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to manage your history.');
  const res = await fetch(`${API_URL}/me/history`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not clear your reading history.');
  revalidatePath('/account');
}
