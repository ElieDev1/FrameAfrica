import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Choose a new password — Frame Africa' };

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="font-heading text-2xl font-black tracking-tight text-text">
          Invalid reset link
        </h1>
        <p className="mt-2 font-body text-sm text-muted">
          This link is missing its token. Request a new one from{' '}
          <Link href="/forgot-password" className="text-primary hover:underline">
            reset your password
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Choose a new password
      </h1>
      <p className="mt-1 font-body text-sm text-muted">
        Pick something at least 8 characters long. You&apos;ll be signed out everywhere else.
      </p>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
