import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.signUp')} — Frame Africa` };
}

export default async function SignupPage() {
  if (await getSession()) {
    redirect('/account');
  }

  const locale = await getLocale();

  return (
    <AuthShell
      eyebrow={t(locale, 'auth.joinFrameAfrica')}
      title={t(locale, 'auth.signUp')}
      subtitle={t(locale, 'auth.createAccountSubtitle')}
      showSocial
      locale={locale}
      footer={
        <p className="font-body text-sm text-muted">
          {t(locale, 'auth.haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t(locale, 'auth.signIn')}
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
