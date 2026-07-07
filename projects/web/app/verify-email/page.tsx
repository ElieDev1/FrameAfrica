import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Verify your email — Frame Africa' };

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type PageProps = { searchParams: Promise<{ token?: string }> };

/**
 * Confirms the token from the emailed link on load. Verification tokens are
 * single-use, so this is done once per link click (email links don't prefetch).
 */
async function verify(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const ok = token ? await verify(token) : false;

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      {ok ? (
        <>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text">
            Email verified
          </h1>
          <p className="mt-2 font-body text-sm text-muted">
            Thanks — your email is confirmed. You&apos;re all set.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black"
          >
            Go to your account
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text">
            Verification link expired
          </h1>
          <p className="mt-2 font-body text-sm text-muted">
            This link is invalid or has already been used. Sign in and we can send you a fresh one.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg border border-border-2 px-4 py-2 font-heading font-bold text-text"
          >
            Go to sign in
          </Link>
        </>
      )}
    </div>
  );
}
