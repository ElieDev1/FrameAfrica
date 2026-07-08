'use server';

import { revalidatePath } from 'next/cache';
import type { SavedArticle } from './api';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface BookmarkState {
  saved: boolean;
}

/** The current reader's save state for an article (null when signed out). */
export async function getBookmarkStatus(articleId: string): Promise<BookmarkState | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/me/bookmarks/${articleId}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: BookmarkState };
    return json.data;
  } catch {
    return null;
  }
}

/** Save or unsave an article; returns the new state (throws if signed out). */
export async function toggleBookmark(articleId: string, save: boolean): Promise<BookmarkState> {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to save this story.');
  const res = await fetch(`${API_URL}/me/bookmarks/${articleId}`, {
    method: save ? 'POST' : 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not update your saved stories.');
  const json = (await res.json()) as { data: BookmarkState };
  revalidatePath('/account');
  return json.data;
}

/** The reader's saved articles (for the account page); [] when signed out. */
export async function fetchSaved(): Promise<SavedArticle[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/me/bookmarks`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: SavedArticle[] };
    return json.data;
  } catch {
    return [];
  }
}
