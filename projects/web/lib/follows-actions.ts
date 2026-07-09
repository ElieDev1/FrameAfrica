'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type FollowTarget = 'section' | 'topic';

export interface FollowState {
  following: boolean;
}

export interface FollowedSubject {
  id: string;
  name: string;
  slug: string;
}

export interface Follows {
  sections: FollowedSubject[];
  topics: FollowedSubject[];
}

/** The reader's follow state for a section/topic (null when signed out). */
export async function getFollowStatus(
  target: FollowTarget,
  id: string,
): Promise<FollowState | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/me/follows/${target}/${id}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: FollowState };
    return json.data;
  } catch {
    return null;
  }
}

/** Follow or unfollow a section/topic; returns the new state (throws if signed out). */
export async function toggleFollow(
  target: FollowTarget,
  id: string,
  follow: boolean,
): Promise<FollowState> {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to follow.');
  const res = await fetch(`${API_URL}/me/follows/${target}/${id}`, {
    method: follow ? 'POST' : 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not update who you follow.');
  const json = (await res.json()) as { data: FollowState };
  revalidatePath('/account');
  return json.data;
}

/** Everything the reader follows (for the account page); empty when signed out. */
export async function fetchFollows(): Promise<Follows> {
  const token = await getAccessToken();
  if (!token) return { sections: [], topics: [] };
  try {
    const res = await fetch(`${API_URL}/me/follows`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { sections: [], topics: [] };
    const json = (await res.json()) as { data: Follows };
    return json.data;
  } catch {
    return { sections: [], topics: [] };
  }
}
