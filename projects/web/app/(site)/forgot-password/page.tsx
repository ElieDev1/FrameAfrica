import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.forgotPassword')} — Frame Africa` };
}

export default async function ForgotPasswordPage() {
  const locale = await getLocale();

  return (
    <AuthShell
      eyebrow={t(locale, 'auth.accountRecovery')}
      title={t(locale, 'auth.forgotPassword')}
      subtitle={t(locale, 'auth.forgotPasswordSubtitle')}
      locale={locale}
      footer={
        <p className="font-body text-sm text-muted">
          {t(locale, 'auth.rememberedIt')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t(locale, 'auth.backToSignIn')}
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
