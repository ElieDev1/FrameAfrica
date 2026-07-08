import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * BFF session. The Next server holds the tokens in its own HTTP-only cookies;
 * the browser never sees them (documents/05-Security-Design.md §3.2, §7).
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const ACCESS_COOKIE = 'fa_access';
export const REFRESH_COOKIE = 'fa_refresh';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  /** True when on a generated password — must set a new one before continuing. */
  mustChangePassword?: boolean;
}

/** The current user (via `/me`), or `null` when signed out / token expired. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: SessionUser };
    return json.data;
  } catch {
    return null;
  }
});

/** Access token for server-side authenticated API calls, or `null`. */
export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}
