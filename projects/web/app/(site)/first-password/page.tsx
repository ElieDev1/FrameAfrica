import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { FirstPasswordForm } from '@/components/auth/FirstPasswordForm';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'auth.choosePassword')} — Frame Africa` };
}

export default async function FirstPasswordPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  // Only relevant for a generated-password account; others already have one.
  if (!user.mustChangePassword) redirect('/account');

  const locale = await getLocale();

  return (
    <AuthShell
      eyebrow={t(locale, 'auth.oneQuickStep')}
      title={t(locale, 'auth.choosePassword')}
      subtitle={t(locale, 'auth.choosePasswordSubtitle')}
      locale={locale}
    >
      <FirstPasswordForm />
    </AuthShell>
  );
}
