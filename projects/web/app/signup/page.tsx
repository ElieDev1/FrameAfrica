import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Create your account — Frame Africa' };

export default async function SignupPage() {
  if (await getSession()) {
    redirect('/account');
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Create your account
      </h1>
      <p className="mt-1 font-body text-sm text-muted">
        Read, bookmark, and follow the stories that matter.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 font-body text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
