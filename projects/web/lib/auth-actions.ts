'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, getAccessToken, REFRESH_COOKIE } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface AuthFormState {
  error?: string;
  /** Login only: the account has 2FA on — prompt for an authenticator code. */
  twoFactorRequired?: boolean;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/** The API's error message (our envelope), or '' if it can't be read. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: { message?: string } };
    return json.error?.message ?? '';
  } catch {
    return '';
  }
}

function readRefreshToken(res: Response): string | null {
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  for (const cookie of headers.getSetCookie?.() ?? []) {
    const match = /^refresh_token=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return null;
}

interface AuthOutcome extends AuthFormState {
  mustChangePassword?: boolean;
}

async function authenticate(
  path: '/auth/login' | '/auth/register',
  payload: Record<string, string>,
): Promise<AuthOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }

  if (!res.ok) {
    if (res.status === 401) {
      // Distinguish the 2FA step from bad credentials via the message token.
      const message = await errorMessage(res);
      if (message === '2FA_REQUIRED') return { twoFactorRequired: true };
      if (message === '2FA_INVALID') {
        return { twoFactorRequired: true, error: 'That code is not valid — try again.' };
      }
      return { error: 'Invalid email or password.' };
    }
    if (res.status === 409) return { error: 'That email is already registered.' };
    if (res.status === 429) return { error: 'Too many attempts — please wait a moment.' };
    return { error: 'Please check your details and try again.' };
  }

  const json = (await res.json()) as {
    data: { accessToken: string; user?: { mustChangePassword?: boolean } };
  };
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, json.data.accessToken, cookieOptions);
  const refresh = readRefreshToken(res);
  if (refresh) jar.set(REFRESH_COOKIE, refresh, cookieOptions);

  return { mustChangePassword: json.data.user?.mustChangePassword ?? false };
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const token = String(formData.get('token') ?? '').trim();
  const result = await authenticate('/auth/login', {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    ...(token ? { token } : {}),
  });
  if (result.twoFactorRequired) return result;
  if (result.error) return result;
  // A generated-password account must set its own password before continuing.
  redirect(result.mustChangePassword ? '/first-password' : '/account');
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticate('/auth/register', {
    displayName: String(formData.get('displayName') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (result.error) return result;
  redirect('/account');
}

/**
 * First-login password change for a generated-password account. The user is
 * already authenticated (they signed in with the temp password), so no email
 * token is needed — just the current session.
 */
export async function setFirstPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 8) return { error: 'Use at least 8 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const token = await getAccessToken();
  if (!token) redirect('/login');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/password/first`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not update your password.' };
  redirect('/account');
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { cookie: `refresh_token=${refresh}` },
        cache: 'no-store',
      });
    } catch {
      // best-effort server-side revocation; local cookies are cleared regardless
    }
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect('/');
}
