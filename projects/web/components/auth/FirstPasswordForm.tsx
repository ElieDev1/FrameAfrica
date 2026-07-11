'use client';

import { useActionState } from 'react';
import { setFirstPassword } from '@/lib/auth-actions';
import { AuthField, SubmitButton } from './form-controls';
import { useT } from '@/components/LocaleProvider';

export function FirstPasswordForm() {
  const [state, action] = useActionState(setFirstPassword, {});
  const t = useT();

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField
        label={t('auth.newPassword')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />
      <AuthField
        label={t('auth.confirmNewPassword')}
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
      <SubmitButton>{t('auth.setPasswordAndContinue')}</SubmitButton>
    </form>
  );
}
