import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FirstPasswordForm } from '@/components/auth/FirstPasswordForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Set your password — Frame Africa' };

export default async function FirstPasswordPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  // Only relevant for a generated-password account; others already have one.
  if (!user.mustChangePassword) redirect('/account');

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Choose a password
      </h1>
      <p className="mt-1 font-body text-sm text-muted">
        Your account was created with a temporary password. Set your own password to continue — you
        won&apos;t need the temporary one again.
      </p>
      <div className="mt-6">
        <FirstPasswordForm />
      </div>
    </div>
  );
}
