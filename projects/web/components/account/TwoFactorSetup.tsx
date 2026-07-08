'use client';

/* eslint-disable @next/next/no-img-element -- QR is an inline data: URI, not a remote asset */

import { useState, useTransition } from 'react';
import {
  disableTwoFactor,
  enableTwoFactor,
  setupTwoFactor,
  type TwoFactorSetupData,
} from '@/lib/twofactor-actions';

export function TwoFactorSetup({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<TwoFactorSetupData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
            Two-factor authentication
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            On
          </span>
        </div>
        <p className="mt-1 font-body text-sm text-muted">
          Your account is protected by an authenticator app. To turn it off, enter a current code.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {codeInput}
          <button
            type="button"
            onClick={turnOff}
            disabled={pending || code.length < 6}
            className="rounded-lg border border-accent-red/40 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-accent-red hover:bg-accent-red/10 disabled:opacity-50"
          >
            Turn off
          </button>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-accent-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <span className="font-heading text-lg font-bold text-text">Two-factor authentication</span>
      <p className="mt-1 font-body text-sm text-muted">
        Add a second step at sign-in using an authenticator app (Google Authenticator, Authy,
        1Password…).
      </p>

      {!setup ? (
        <button
          type="button"
          onClick={begin}
          disabled={pending}
          className="mt-3 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Starting…' : 'Set up 2FA'}
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-body text-sm text-text">
            1. Scan this QR code with your authenticator app:
          </p>
          <img
            src={setup.qrDataUrl}
            alt="2FA QR code"
            width={176}
            height={176}
            className="rounded-lg border border-border bg-white p-2"
          />
          <p className="font-body text-sm text-muted">
            Or enter this key manually:{' '}
            <code className="select-all rounded bg-surface-2 px-2 py-0.5 font-mono text-text">
              {setup.secret}
            </code>
          </p>
          <p className="font-body text-sm text-text">2. Enter the 6-digit code it shows:</p>
          <div className="flex items-center gap-2">
            {codeInput}
            <button
              type="button"
              onClick={confirm}
              disabled={pending || code.length < 6}
              className="rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Verifying…' : 'Enable'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 font-mono text-xs text-accent-red">{error}</p>}
    </div>
  );
}
