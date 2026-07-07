'use client';

import { useActionState } from 'react';
import { login } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';

export function LoginForm() {
  const [state, action] = useActionState(login, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField label="Email" name="email" type="email" autoComplete="email" required />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
