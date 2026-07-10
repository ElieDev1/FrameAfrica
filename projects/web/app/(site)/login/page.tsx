import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in — Frame Africa' };

export default async function LoginPage() {
  if (await getSession()) {
    redirect('/account');
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Pick up where you left off across Frame Africa."
      showSocial
      footer={
        <>
          <p className="font-body text-sm text-muted">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p className="font-body text-sm text-muted">
            New here?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
