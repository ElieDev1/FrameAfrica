'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/lib/account-actions';
import { AuthField, SubmitButton } from './form-controls';
import { useT } from '@/components/LocaleProvider';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, {});
  const t = useT();

  if (state.done) {
    return (
      <p role="status" className="font-body text-sm text-muted">
        {t('auth.resetLinkSent')}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField label={t('auth.email')} name="email" type="email" autoComplete="email" required />
      <SubmitButton>{t('auth.sendResetLink')}</SubmitButton>
    </form>
  );
}
