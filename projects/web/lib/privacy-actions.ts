'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, getAccessToken, REFRESH_COOKIE } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/**
 * Permanently delete the signed-in reader's account (password-confirmed). On
 * success, clears the session cookies and redirects home. Returns an error
 * message on failure so the form can show it.
 */
export async function deleteMyAccount(password: string): Promise<{ error: string } | void> {
  const token = await getAccessToken();
  if (!token) {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/me/delete`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (res.status === 401) {
    return { error: 'Password is incorrect.' };
  }
  if (!res.ok) {
    return { error: 'Could not delete your account. Please try again.' };
  }

  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect('/?goodbye=1');
}
