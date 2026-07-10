import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Choose a new password — Frame Africa' };

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Invalid reset link"
        subtitle="This link is missing its token — request a fresh one to continue."
        footer={
          <p className="font-body text-sm text-muted">
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              Reset your password
            </Link>
          </p>
        }
      >
        <p className="font-body text-sm text-muted">
          For your security, reset links expire after a short time. Start again and we&apos;ll email
          you a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Pick something at least 8 characters long. You'll be signed out everywhere else."
      footer={
        <p className="font-body text-sm text-muted">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
