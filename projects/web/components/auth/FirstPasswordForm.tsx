'use client';

import { useActionState } from 'react';
import { setFirstPassword } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';

export function FirstPasswordForm() {
  const [state, action] = useActionState(setFirstPassword, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />
      <AuthField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <SubmitButton>Set password &amp; continue</SubmitButton>
    </form>
  );
}
