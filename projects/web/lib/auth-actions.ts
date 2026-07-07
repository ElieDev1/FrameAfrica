'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface AuthFormState {
  error?: string;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function readRefreshToken(res: Response): string | null {
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  for (const cookie of headers.getSetCookie?.() ?? []) {
    const match = /^refresh_token=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return null;
}

async function authenticate(
  path: '/auth/login' | '/auth/register',
  payload: Record<string, string>,
): Promise<AuthFormState> {
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
    if (res.status === 401) return { error: 'Invalid email or password.' };
    if (res.status === 409) return { error: 'That email is already registered.' };
    if (res.status === 429) return { error: 'Too many attempts — please wait a moment.' };
    return { error: 'Please check your details and try again.' };
  }

  const json = (await res.json()) as { data: { accessToken: string } };
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, json.data.accessToken, cookieOptions);
  const refresh = readRefreshToken(res);
  if (refresh) jar.set(REFRESH_COOKIE, refresh, cookieOptions);

  return {};
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticate('/auth/login', {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (result.error) return result;
  redirect('/account');
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
