'use client';

import { useMemo, useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { activateSubscription, revokeSubscription } from '@/lib/billing-admin-actions';
import type { AdminSubscription } from '@/lib/billing-types';
import { formatDate } from '@/lib/format';

const STATUS_TONE: Record<string, string> = {
  active: 'text-accent-green',
  past_due: 'text-primary',
  canceled: 'text-muted',
  expired: 'text-faint',
  incomplete: 'text-primary',
};

const PAGE_SIZE = 10;

type Filter = 'all' | 'active' | 'pending';

/**
 * Who's subscribed, and the two actions that aren't self-serve:
 *
 * - **Activate** — someone paid, but the gateway never confirmed it (a
 *   mobile-money payment taken while webhooks weren't wired, a bank transfer
 *   checked by hand). The admin vouches the money landed and grants access.
 * - **Revoke** — end an active subscription now (refund, chargeback, abuse).
 *   A reader cancels their own from the account page, which lets paid days run
 *   out; this is the immediate override.
 */
export function SubscribersTable({ subscriptions }: { subscriptions: AdminSubscription[] }) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);

  const counts = useMemo(
    () => ({
      all: subscriptions.length,
      active: subscriptions.filter((s) => s.isActive).length,
      pending: subscriptions.filter((s) => s.needsActivation).length,
    }),
    [subscriptions],
  );

  const rows = useMemo(() => {
    if (filter === 'active') return subscriptions.filter((s) => s.isActive);
    if (filter === 'pending') return subscriptions.filter((s) => s.needsActivation);
    return subscriptions;
  }, [subscriptions, filter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function choose(next: Filter) {
    setFilter(next);
    setPage(0); // a new filter always starts at its first page
  }

  function run(
    sub: AdminSubscription,
    action: 'activate' | 'revoke',
    ask: { title: string; message: string; confirmLabel: string },
  ) {
    startTransition(async () => {
      if (!(await confirm(ask))) return;
      setError(null);
      setBusyId(sub.id);
      const res =
        action === 'activate'
          ? await activateSubscription(sub.id)
          : await revokeSubscription(sub.id);
      setBusyId(null);
      if (!res.ok) setError(res.error ?? 'Something went wrong.');
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-text">Subscribers</h2>
          <p className="mt-0.5 font-body text-sm text-muted">
            Everyone who has subscribed, and anyone whose payment is still waiting to be confirmed.
          </p>
        </div>

        {/* Filters double as the counts. */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(
            [
              ['all', `All ${counts.all}`],
              ['active', `Active ${counts.active}`],
              ['pending', `Awaiting activation ${counts.pending}`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition ${
                filter === key ? 'bg-primary text-black' : 'text-muted hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] text-accent-red"
        >
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center font-body text-sm text-muted">
          {filter === 'pending'
            ? 'Nothing waiting — every payment has been confirmed.'
            : 'No subscribers yet. Add one below, or wait for the first paid subscription.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-left">
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
                {shown.map((s) => (
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
                      {s.needsActivation ? '—' : formatDate(s.currentPeriodEnd)}
                      {s.cancelAtPeriodEnd && <span className="ml-1 text-faint">(ending)</span>}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-mono text-xs uppercase ${STATUS_TONE[s.status] ?? 'text-muted'}`}
                    >
                      {s.needsActivation ? 'awaiting' : s.status}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {s.needsActivation && (
                        <button
                          type="button"
                          disabled={pending && busyId === s.id}
                          onClick={() =>
                            run(s, 'activate', {
                              title: 'Activate this subscription?',
                              message: `Confirm ${s.user.name} paid for “${s.planName}”. This grants access immediately — only do it once you've seen the money land.`,
                              confirmLabel: 'Activate',
                            })
                          }
                          className="rounded-md bg-primary px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          {busyId === s.id ? '…' : 'Activate'}
                        </button>
                      )}
                      {s.isActive && (
                        <button
                          type="button"
                          disabled={pending && busyId === s.id}
                          onClick={() =>
                            run(s, 'revoke', {
                              title: 'End this subscription now?',
                              message: `${s.user.name} (${s.user.email}) loses access to “${s.planName}” immediately. This does not refund them — do that in the gateway.`,
                              confirmLabel: 'Revoke access',
                            })
                          }
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

          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-faint">
                {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} of{' '}
                {rows.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 0}
                  className="rounded-md border border-border px-2.5 py-1 font-mono text-[11px] uppercase text-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px] text-muted">
                  {current + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current >= pageCount - 1}
                  className="rounded-md border border-border px-2.5 py-1 font-mono text-[11px] uppercase text-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
