'use server';

import { redirect } from 'next/navigation';

/**
 * BFF actions for the password-reset flow. These call the public auth endpoints
 * (token-authenticated, no session needed). The forgot step always reports the
 * same result so it can't be used to probe which emails are registered.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface AccountFormState {
  error?: string;
  done?: boolean;
}

export async function requestPasswordReset(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = String(formData.get('email') ?? '');
  try {
    await fetch(`${API_URL}/auth/password/forgot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
  } catch {
    // Swallow — we show the same confirmation whether or not delivery succeeded,
    // so a failed send never reveals whether the address exists.
  }
  return { done: true };
}

export async function resetPassword(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/password/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (!res.ok) {
    if (res.status === 401) {
      return { error: 'This reset link is invalid or has expired. Request a new one.' };
    }
    if (res.status === 400) return { error: 'Your password must be at least 8 characters.' };
    if (res.status === 429) return { error: 'Too many attempts — please wait a moment.' };
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/login?reset=1');
}
