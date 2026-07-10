import { NextResponse, type NextRequest } from 'next/server';
import { isTokenExpired } from '@/lib/jwt';

/**
 * Two jobs:
 *  1. Expose the request path as `x-pathname` so Server Components (e.g. the
 *     public header/footer) can tell whether they're rendering under `/dashboard`.
 *  2. Keep the BFF session alive: when the access token has expired but a refresh
 *     token is present, rotate it and update both the request cookies (so the
 *     current render sees the new token) and the response cookies.
 *
 * Note: refresh-token rotation + Next.js prefetching can, in rare races, use the
 * same refresh token twice and trip reuse detection. A refresh lock is a follow-up.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const ACCESS_COOKIE = 'fa_access';
const REFRESH_COOKIE = 'fa_refresh';
/** Opaque per-device id, used only to count metered article reads. No PII. */
const READER_COOKIE = 'fa_reader';
const READER_MAX_AGE = 31_536_000; // 1 year

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

function withCookies(base: string, updates: Record<string, string>): string {
  const jar = new Map<string, string>();
  for (const part of base.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key) jar.set(key, rest.join('='));
  }
  for (const [key, value] of Object.entries(updates)) jar.set(key, value);
  return [...jar].map(([key, value]) => `${key}=${value}`).join('; ');
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Mint a reader id on first visit so the paywall meter can count reads.
  const existingReader = request.cookies.get(READER_COOKIE)?.value;
  const readerKey = existingReader ?? crypto.randomUUID();
  const mintedReader = !existingReader;
  if (mintedReader) {
    // Make it visible to *this* render, not just the next one.
    requestHeaders.set(
      'cookie',
      withCookies(request.headers.get('cookie') ?? '', { [READER_COOKIE]: readerKey }),
    );
  }
  /** Attach the freshly minted reader cookie to whatever response we return. */
  const finish = (res: NextResponse) => {
    if (mintedReader) {
      res.cookies.set(READER_COOKIE, readerKey, { ...cookieOptions, maxAge: READER_MAX_AGE });
    }
    return res;
  };

  const pass = () => finish(NextResponse.next({ request: { headers: requestHeaders } }));

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh) return pass();
  if (access && !isTokenExpired(access)) return pass();

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `refresh_token=${refresh}` },
      cache: 'no-store',
    });
  } catch {
    return pass(); // API unreachable — leave the session untouched
  }

  if (!apiRes.ok) {
    const res = pass();
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const json = (await apiRes.json()) as { data: { accessToken: string } };
  const newAccess = json.data.accessToken;
  const newRefresh = extractRefreshToken(apiRes) ?? refresh;

  // Forward the fresh tokens to the current render, and store them on the browser.
  requestHeaders.set(
    'cookie',
    withCookies(request.headers.get('cookie') ?? '', {
      [ACCESS_COOKIE]: newAccess,
      [REFRESH_COOKIE]: newRefresh,
      [READER_COOKIE]: readerKey,
    }),
  );
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set(ACCESS_COOKIE, newAccess, cookieOptions);
  res.cookies.set(REFRESH_COOKIE, newRefresh, cookieOptions);
  return finish(res);
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
};
