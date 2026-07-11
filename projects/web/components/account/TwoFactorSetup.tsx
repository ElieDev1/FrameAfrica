'use client';

/* eslint-disable @next/next/no-img-element -- QR is an inline data: URI, not a remote asset */

import { useState, useTransition } from 'react';
import {
  disableTwoFactor,
  enableTwoFactor,
  setupTwoFactor,
  type TwoFactorSetupData,
} from '@/lib/twofactor-actions';
import { useT } from '@/components/LocaleProvider';

export function TwoFactorSetup({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<TwoFactorSetupData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function begin() {
    setError(null);
    startTransition(async () => {
      const res = await setupTwoFactor();
      if (res.error) setError(res.error);
      else setSetup(res.data ?? null);
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await enableTwoFactor(code);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEnabled(true);
      setSetup(null);
      setCode('');
    });
  }

  function turnOff() {
    setError(null);
    startTransition(async () => {
      const res = await disableTwoFactor(code);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEnabled(false);
      setCode('');
    });
  }

  const codeInput = (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="123456"
      className="w-32 rounded-lg border border-border bg-surface-2 px-3 py-2 text-center font-mono tracking-[0.3em] text-text outline-none focus:border-primary"
    />
  );

  if (enabled) {
    return (
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-text">
            {t('account.twoFactorAuth')}
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            {t('account.twoFactorOn')}
          </span>
        </div>
        <p className="mt-1 font-body text-sm text-muted">{t('account.twoFactorActiveNotice')}</p>
        <div className="mt-3 flex items-center gap-2">
          {codeInput}
          <button
            type="button"
            onClick={turnOff}
            disabled={pending || code.length < 6}
            className="rounded-lg border border-accent-red/40 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-accent-red hover:bg-accent-red/10 disabled:opacity-50"
          >
            {t('account.turnOff')}
          </button>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-accent-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <span className="font-heading text-lg font-bold text-text">{t('account.twoFactorAuth')}</span>
      <p className="mt-1 font-body text-sm text-muted">{t('account.twoFactorSubtitle')}</p>

      {!setup ? (
        <button
          type="button"
          onClick={begin}
          disabled={pending}
          className="mt-3 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t('common.pleaseWait') : `${t('account.twoFactorSetUp')} 2FA`}
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-body text-sm text-text">{t('account.scanQR')}</p>
          <img
            src={setup.qrDataUrl}
            alt="2FA QR code"
            width={176}
            height={176}
            className="rounded-lg border border-border bg-white p-2"
          />
          <p className="font-body text-sm text-muted">
            {t('account.enterManualKey')}{' '}
            <code className="select-all rounded bg-surface-2 px-2 py-0.5 font-mono text-text">
              {setup.secret}
            </code>
          </p>
          <p className="font-body text-sm text-text">{t('account.enter6Digit')}</p>
          <div className="flex items-center gap-2">
            {codeInput}
            <button
              type="button"
              onClick={confirm}
              disabled={pending || code.length < 6}
              className="rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
            >
              {pending ? t('account.verifying') : t('account.enable')}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 font-mono text-xs text-accent-red">{error}</p>}
    </div>
  );
}
