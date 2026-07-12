'use client';

import { useActionState } from 'react';
import { resetPassword } from '@/lib/account-actions';
import { AuthField, SubmitButton } from './form-controls';
import { useT } from '@/components/LocaleProvider';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, {});
  const t = useT();

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <AuthField
        label={t('auth.newPassword')}
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
      <SubmitButton>{t('auth.chooseNewPassword')}</SubmitButton>
    </form>
  );
}
