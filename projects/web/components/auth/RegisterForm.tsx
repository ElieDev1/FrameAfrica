'use client';

import { useActionState } from 'react';
import { register } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';

export function RegisterForm() {
  const [state, action] = useActionState(register, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <AuthField label="Name" name="displayName" autoComplete="name" required minLength={2} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" required />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
