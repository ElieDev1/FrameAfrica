'use client';

import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { formatDate } from '@/lib/format';
import { revokeSubscription } from '@/lib/billing-admin-actions';
import type { AdminSubscription } from '@/lib/billing-types';

const STATUS_TONE: Record<string, string> = {
  active: 'text-accent-green',
  past_due: 'text-primary',
  canceled: 'text-muted',
  expired: 'text-faint',
  incomplete: 'text-faint',
};

/**
 * Who's subscribed, and the one management action that isn't self-serve: ending
 * a subscription now (a refund, a chargeback, an abuse case). A reader cancels
 * their own from the account page — this is the admin's override.
 */
export function SubscribersTable({ subscriptions }: { subscriptions: AdminSubscription[] }) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = subscriptions.filter((s) => s.isActive).length;

  function revoke(sub: AdminSubscription) {
    startTransition(async () => {
      const ok = await confirm({
        title: 'End this subscription now?',
        message: `${sub.user.name} (${sub.user.email}) loses access to “${sub.planName}” immediately. This does not refund them — do that in the gateway.`,
        confirmLabel: 'Revoke access',
      });
      if (!ok) return;
      setError(null);
      setBusyId(sub.id);
      const res = await revokeSubscription(sub.id);
      setBusyId(null);
      if (!res.ok) setError(res.error ?? 'Could not revoke.');
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-text">Subscribers</h2>
        <span className="rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] text-muted">
          <span className="font-bold text-accent-green">{active}</span> active ·{' '}
          {subscriptions.length} total
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] text-accent-red"
        >
          {error}
        </p>
      )}

      {subscriptions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center font-body text-sm text-muted">
          No subscribers yet. Grant one above, or wait for the first paid subscription.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <th className="px-4 py-2 font-medium">Reader</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Renews / ends</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-body text-sm font-semibold text-text">{s.user.name}</p>
                    <p className="font-mono text-[11px] text-muted">{s.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5 font-body text-sm text-muted">{s.planName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs uppercase text-muted">
                    {s.provider}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted">
                    {formatDate(s.currentPeriodEnd)}
                    {s.cancelAtPeriodEnd && <span className="ml-1 text-faint">(ending)</span>}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-mono text-xs uppercase ${STATUS_TONE[s.status] ?? 'text-muted'}`}
                  >
                    {s.status}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.isActive && (
                      <button
                        type="button"
                        disabled={pending && busyId === s.id}
                        onClick={() => revoke(s)}
                        className="rounded-md border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
                      >
                        {busyId === s.id ? '…' : 'Revoke'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
