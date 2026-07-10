import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Create your account — Frame Africa' };

export default async function SignupPage() {
  if (await getSession()) {
    redirect('/account');
  }

  return (
    <AuthShell
      eyebrow="Join Frame Africa"
      title="Create your account"
      subtitle="Read, bookmark, and follow the stories that matter."
      footer={
        <p className="font-body text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
