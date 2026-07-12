import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.signIn')} — Frame Africa` };
}

export default async function LoginPage() {
  if (await getSession()) {
    redirect('/account');
  }

  const locale = await getLocale();

  return (
    <AuthShell
      eyebrow={t(locale, 'dash.welcome')}
      title={t(locale, 'auth.signIn')}
      subtitle={t(locale, 'auth.signInSubtitle')}
      showSocial
      locale={locale}
      footer={
        <>
          <p className="font-body text-sm text-muted">
            <Link href="/forgot-password" className="text-primary hover:underline">
              {t(locale, 'auth.forgotPassword')}
            </Link>
          </p>
          <p className="font-body text-sm text-muted">
            {t(locale, 'auth.newHere')}{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t(locale, 'auth.signUp')}
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
