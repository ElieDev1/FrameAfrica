/**
 * Client-safe billing types and money formatting. Kept apart from `billing.ts`
 * because that module reads the session (`next/headers`), which a client
 * component may not import.
 */

export type PlanInterval = 'month' | 'year';
export type PaymentProvider = 'stripe' | 'momo' | 'airtel' | 'manual';
export type SubscriptionStatus = 'incomplete' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PaymentState = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: PlanInterval;
  trialDays: number;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  plan: Plan;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

export interface PaymentRecord {
  id: string;
  amountCents: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentState;
  paidAt: string | null;
  createdAt: string;
}

/** A downloadable receipt for one settled payment. */
export interface Receipt {
  number: string;
  issuedAt: string;
  amountCents: number;
  currency: string;
  provider: PaymentProvider;
  reference: string | null;
  plan: { name: string; interval: PlanInterval };
  billedTo: { name: string; email: string };
  period: { start: string; end: string } | null;
  verifyUrl: string;
  qrDataUrl: string;
}

/** Currencies with no minor unit — the stored "cents" are already whole units. */
const ZERO_DECIMAL = ['RWF', 'JPY', 'KRW', 'UGX', 'XOF', 'XAF'];

/** Money as a reader reads it: `5,000 RWF`, `€4.99`. */
export function formatMoney(cents: number, currency: string, locale = 'en'): string {
  const zero = ZERO_DECIMAL.includes(currency);
  const amount = zero ? cents : cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: zero ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}
