import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.chooseNewPassword')} — Frame Africa` };
}

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const locale = await getLocale();

  if (!token) {
    return (
      <AuthShell
        eyebrow={t(locale, 'auth.accountRecovery')}
        title={t(locale, 'auth.invalidResetLink')}
        subtitle={t(locale, 'auth.missingTokenSubtitle')}
        locale={locale}
        footer={
          <p className="font-body text-sm text-muted">
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              {t(locale, 'auth.forgotPassword')}
            </Link>
          </p>
        }
      >
        <p className="font-body text-sm text-muted">{t(locale, 'auth.resetLinksExpireNotice')}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t(locale, 'auth.accountRecovery')}
      title={t(locale, 'auth.chooseNewPassword')}
      subtitle={t(locale, 'auth.chooseNewPasswordSubtitle')}
      locale={locale}
      footer={
        <p className="font-body text-sm text-muted">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t(locale, 'auth.backToSignIn')}
          </Link>
        </p>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
