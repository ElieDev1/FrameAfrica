import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.emailVerified')} — Frame Africa` };
}

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
  const locale = await getLocale();

  if (ok) {
    return (
      <AuthShell
        eyebrow={t(locale, 'auth.allSet')}
        title={t(locale, 'auth.emailVerified')}
        subtitle={t(locale, 'auth.emailVerifiedSubtitle')}
        locale={locale}
      >
        <Link
          href="/account"
          className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center font-heading font-bold text-black"
        >
          {t(locale, 'auth.goToAccount')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t(locale, 'auth.account')}
      title={t(locale, 'auth.verificationExpired')}
      subtitle={t(locale, 'auth.verificationExpiredSubtitle')}
      locale={locale}
    >
      <Link
        href="/login"
        className="block w-full rounded-lg border border-border-2 px-4 py-2.5 text-center font-heading font-bold text-text hover:border-primary"
      >
        {t(locale, 'auth.goToSignIn')}
      </Link>
    </AuthShell>
  );
}
