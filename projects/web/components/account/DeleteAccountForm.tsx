'use client';

import { useState, useTransition } from 'react';
import { deleteMyAccount } from '@/lib/privacy-actions';

/**
 * Two-step account deletion: a button that reveals a password-confirmed form.
 * Irreversible; on success the server action clears the session and redirects.
 */
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await deleteMyAccount(password);
      if (result?.error) setError(result.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-accent-red/50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-accent-red transition hover:bg-accent-red/10"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-accent-red/40 bg-accent-red/5 p-4"
    >
      <p className="font-body text-sm text-text">
        This <strong>permanently</strong> deletes your account and personal data (saved stories,
        follows, reading history). Published comments are kept but anonymised. This can&apos;t be
        undone.
      </p>
      <label className="mt-3 block">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Confirm your password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-text outline-none focus:border-accent-red"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-accent-red">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || password.length === 0}
          className="rounded-lg bg-accent-red px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setPassword('');
          }}
          className="font-mono text-xs uppercase tracking-wide text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
