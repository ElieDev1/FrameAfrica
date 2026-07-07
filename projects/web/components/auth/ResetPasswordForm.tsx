'use client';

import { useActionState } from 'react';
import { resetPassword } from '@/lib/account-actions';
import { AuthField, SubmitButton } from './form-controls';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <SubmitButton>Set new password</SubmitButton>
    </form>
  );
}
