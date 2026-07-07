import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in — Frame Africa' };

export default async function LoginPage() {
  if (await getSession()) {
    redirect('/account');
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Sign in</h1>
      <p className="mt-1 font-body text-sm text-muted">Welcome back to Frame Africa.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 font-body text-sm text-muted">
        New here?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
