import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { FirstPasswordForm } from '@/components/auth/FirstPasswordForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Set your password — Frame Africa' };

export default async function FirstPasswordPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  // Only relevant for a generated-password account; others already have one.
  if (!user.mustChangePassword) redirect('/account');

  return (
    <AuthShell
      eyebrow="One quick step"
      title="Choose a password"
      subtitle="Your account was created with a temporary password. Set your own to continue — you won't need the temporary one again."
    >
      <FirstPasswordForm />
    </AuthShell>
  );
}
