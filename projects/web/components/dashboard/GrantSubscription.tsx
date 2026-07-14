'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckIcon, CreditCardIcon } from '@/components/icons';
import { grantSubscription, type GrantState } from '@/lib/billing-admin-actions';
import { formatMoney, type Plan } from '@/lib/billing-types';

function GrantButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      <CheckIcon size={14} />
      {pending ? 'Granting…' : 'Grant subscription'}
    </button>
  );
}

/**
 * Admin: comp a subscription without a card — a corporate deal, a cash payment
 * taken offline, a giveaway. It grants against an email (an admin doesn't know
 * user ids), and every grant is the same as a paid one: it extends the reader's
 * access from the current period end, so comping someone twice never shortens
 * what they already have.
 */
export function GrantSubscription({ plans }: { plans: Plan[] }) {
  const [state, action] = useActionState<GrantState, FormData>(grantSubscription, {});

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-text">
        <CreditCardIcon size={16} className="text-primary" />
        Grant a subscription
      </h2>
      <p className="mt-0.5 max-w-xl font-body text-sm text-muted">
        Give a reader access without a payment — for corporate deals, cash paid offline, or a comp.
        It behaves exactly like a paid subscription.
      </p>

      {plans.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[11px] text-faint">
          No plans exist yet — add one before you can grant it.
        </p>
      ) : (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Reader’s email
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="reader@example.com"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>

          <label className="min-w-44">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Plan
            </span>
            <select
              name="planCode"
              required
              defaultValue=""
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
            >
              <option value="" disabled>
                Choose a plan
              </option>
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — {formatMoney(plan.priceCents, plan.currency)}/{plan.interval}
                </option>
              ))}
            </select>
          </label>

          <GrantButton />
        </form>
      )}

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] text-accent-red"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 rounded-lg border border-accent-green/30 bg-accent-green/10 px-3 py-2 font-mono text-[11px] text-accent-green">
          {state.message}
        </p>
      )}
    </section>
  );
}
