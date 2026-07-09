import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset your password — Frame Africa' };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Reset your password
      </h1>
      <p className="mt-1 font-body text-sm text-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 font-body text-sm text-muted">
        Remembered it?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
