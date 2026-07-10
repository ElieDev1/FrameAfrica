import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

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

  if (ok) {
    return (
      <AuthShell
        eyebrow="All set"
        title="Email verified"
        subtitle="Thanks — your email is confirmed and your account is ready."
      >
        <Link
          href="/account"
          className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center font-heading font-bold text-black"
        >
          Go to your account
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Verification link expired"
      subtitle="This link is invalid or has already been used. Sign in and we can send you a fresh one."
    >
      <Link
        href="/login"
        className="block w-full rounded-lg border border-border-2 px-4 py-2.5 text-center font-heading font-bold text-text hover:border-primary"
      >
        Go to sign in
      </Link>
    </AuthShell>
  );
}
