'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/lib/account-actions';
import { AuthField, SubmitButton } from './form-controls';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, {});

  if (state.done) {
    return (
      <p role="status" className="font-body text-sm text-muted">
        If an account exists for that email, we&apos;ve sent a link to reset your password. Check
        your inbox (and spam).
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField label="Email" name="email" type="email" autoComplete="email" required />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}
