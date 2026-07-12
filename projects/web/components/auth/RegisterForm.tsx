'use client';

import { useActionState } from 'react';
import { register } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';
import { useT } from '@/components/LocaleProvider';

export function RegisterForm() {
  const [state, action] = useActionState(register, {});
  const t = useT();

  return (
    <form action={action} className="flex flex-col gap-3">
      <AuthField
        label={t('auth.name')}
        name="displayName"
        autoComplete="name"
        required
        minLength={2}
      />
      <AuthField label={t('auth.email')} name="email" type="email" autoComplete="email" required />
      <AuthField
        label={t('auth.password')}
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
      <SubmitButton>{t('auth.signUp')}</SubmitButton>
    </form>
  );
}
