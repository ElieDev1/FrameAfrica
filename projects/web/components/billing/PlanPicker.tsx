'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckIcon } from '@/components/icons';
import { useLocale, useT } from '@/components/LocaleProvider';
import { checkoutAction, type CheckoutState } from '@/lib/billing-actions';
import { formatMoney, type PaymentProvider, type Plan } from '@/lib/billing-types';

const PROVIDERS: { value: PaymentProvider; labelKey: 'pay.momo' | 'pay.airtel' | 'pay.card' }[] = [
  { value: 'momo', labelKey: 'pay.momo' },
  { value: 'airtel', labelKey: 'pay.airtel' },
  { value: 'stripe', labelKey: 'pay.card' },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-2.5 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? '…' : label}
    </button>
  );
}

/**
 * The subscribe form: pick a plan, pick how to pay. Mobile money asks for the
 * handset to charge; a card hands off to the gateway's hosted checkout, so no
 * card details ever touch our servers.
 */
export function PlanPicker({ plans }: { plans: Plan[] }) {
  const t = useT();
  const locale = useLocale();
  const [selected, setSelected] = useState(plans[0]?.code ?? '');
  const [provider, setProvider] = useState<PaymentProvider>('momo');
  const [state, action] = useActionState<CheckoutState, FormData>(checkoutAction, {});

  const needsPhone = provider === 'momo' || provider === 'airtel';

  if (plans.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center font-body text-muted">
        {t('pay.noPlans')}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const active = selected === plan.code;
          return (
            <label
              key={plan.code}
              className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-5 transition ${
                active
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="planCode"
                value={plan.code}
                checked={active}
                onChange={() => setSelected(plan.code)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span className="font-heading text-lg font-bold text-text">{plan.name}</span>
                {active && <CheckIcon size={18} className="text-primary" />}
              </span>
              <span className="font-heading text-2xl font-black text-text">
                {formatMoney(plan.priceCents, plan.currency, locale)}
                <span className="ml-1 font-mono text-xs font-normal text-faint">
                  /{plan.interval === 'year' ? t('pay.year') : t('pay.month')}
                </span>
              </span>
              {plan.description && (
                <span className="font-body text-sm text-muted">{plan.description}</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Payment method */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
          {t('pay.method')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <label
              key={p.value}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                provider === p.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={p.value}
                checked={provider === p.value}
                onChange={() => setProvider(p.value)}
                className="sr-only"
              />
              {t(p.labelKey)}
            </label>
          ))}
        </div>

        {needsPhone && (
          <label className="mt-1 flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              {t('pay.phone')}
            </span>
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              placeholder="+250 7XX XXX XXX"
              className="w-full max-w-xs rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary"
            />
            <span className="font-body text-xs text-muted">{t('pay.phoneHint')}</span>
          </label>
        )}
      </fieldset>

      <div className="max-w-xs">
        <SubmitButton label={t('pay.subscribe')} />
        {state.error && (
          <p role="alert" className="mt-2 font-mono text-xs text-accent-red">
            {state.error}
          </p>
        )}
        {state.pendingMessage && (
          <p
            role="status"
            className="mt-2 rounded-lg border border-accent-green/40 bg-accent-green/5 px-3 py-2 font-body text-sm text-text"
          >
            {state.pendingMessage}
          </p>
        )}
      </div>
    </form>
  );
}
