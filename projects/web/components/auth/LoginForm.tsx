'use client';

import { useActionState } from 'react';
import { login } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';
import { useT } from '@/components/LocaleProvider';

export function LoginForm() {
  const [state, action] = useActionState(login, {});
  const twoFactor = state.twoFactorRequired ?? false;
  const t = useT();

  return (
    <form action={action} className="flex flex-col gap-3">
      <AuthField label={t('auth.email')} name="email" type="email" autoComplete="email" required />
      <AuthField
        label={t('auth.password')}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {twoFactor && (
        <>
          <p className="font-body text-sm text-muted">{t('auth.emailCodeSubtitle')}</p>
          <AuthField
            label={t('auth.twoFactorCode')}
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
      <SubmitButton>{twoFactor ? t('auth.verifySignIn') : t('auth.signIn')}</SubmitButton>
    </form>
  );
}
