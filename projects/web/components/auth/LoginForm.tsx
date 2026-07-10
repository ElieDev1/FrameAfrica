'use client';

import { useActionState } from 'react';
import { login } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';

export function LoginForm() {
  const [state, action] = useActionState(login, {});
  const twoFactor = state.twoFactorRequired ?? false;

  return (
    <form action={action} className="flex flex-col gap-3">
      <AuthField label="Email" name="email" type="email" autoComplete="email" required />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {twoFactor && (
        <>
          <p className="font-body text-sm text-muted">
            Enter the 6-digit code from your authenticator app.
          </p>
          <AuthField
            label="Authentication code"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </>
      )}
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <SubmitButton>{twoFactor ? 'Verify & sign in' : 'Sign in'}</SubmitButton>
    </form>
  );
}
