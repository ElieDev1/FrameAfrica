'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface ProfileFormState {
  error?: string;
  success?: boolean;
}

/**
 * Update the signed-in reader's display name and avatar. Server action bound to
 * the account edit form; revalidates the account page and header on success so
 * the new name/photo appear immediately.
 */
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const token = await getAccessToken();
  if (!token) return { error: 'Your session has expired. Please sign in again.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim();

  if (displayName.length < 2) {
    return { error: 'Display name must be at least 2 characters.' };
  }

  // Byline fields — only sent for staff, whose form renders them. `has()` lets us
  // tell "left blank on purpose" (clear it) from "not on this form" (leave it).
  const body: Record<string, string> = { displayName, avatarUrl };
  if (formData.has('bio')) body.bio = String(formData.get('bio') ?? '').trim();
  if (formData.has('jobTitle')) body.jobTitle = String(formData.get('jobTitle') ?? '').trim();

  try {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { error: body?.message ?? 'Could not save your profile. Please try again.' };
    }
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  revalidatePath('/account');
  revalidatePath('/', 'layout');
  return { success: true };
}
