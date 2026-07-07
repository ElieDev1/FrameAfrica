import { NextResponse, type NextRequest } from 'next/server';
import { isTokenExpired } from '@/lib/jwt';

/**
 * Keeps the BFF session alive: when the short-lived access token has expired but
 * a refresh token is present, transparently refresh it (rotating per the API's
 * reuse-detection policy) and update both the request cookies (so the current
 * render sees the new token) and the response cookies (so the browser stores it).
 *
 * Note: refresh-token rotation + Next.js prefetching can, in rare races, use the
 * same refresh token twice and trip reuse detection (logging the user out). A
 * refresh lock is a follow-up.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const ACCESS_COOKIE = 'fa_access';
const REFRESH_COOKIE = 'fa_refresh';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function extractRefreshToken(res: Response): string | null {
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  for (const cookie of headers.getSetCookie?.() ?? []) {
    const match = /^refresh_token=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh) return NextResponse.next();
  if (access && !isTokenExpired(access)) return NextResponse.next();

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `refresh_token=${refresh}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.next(); // API unreachable — leave the session untouched
  }

  if (!apiRes.ok) {
    const res = NextResponse.next();
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const json = (await apiRes.json()) as { data: { accessToken: string } };
  const newAccess = json.data.accessToken;
  const newRefresh = extractRefreshToken(apiRes) ?? refresh;

  request.cookies.set(ACCESS_COOKIE, newAccess);
  request.cookies.set(REFRESH_COOKIE, newRefresh);
  const res = NextResponse.next({ request });
  res.cookies.set(ACCESS_COOKIE, newAccess, cookieOptions);
  res.cookies.set(REFRESH_COOKIE, newRefresh, cookieOptions);
  return res;
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
};
