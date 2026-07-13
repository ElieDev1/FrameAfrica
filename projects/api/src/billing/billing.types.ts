import type { PaymentProvider, PlanInterval, SubscriptionStatus } from '@prisma/client';

/** A plan as the pricing page sees it. */
export interface PlanView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: PlanInterval;
  trialDays: number;
}

/** The reader's own billing state — drives the account page and the paywall CTA. */
export interface SubscriptionView {
  id: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  plan: PlanView;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  /** True while access is actually granted (status active/trialing and not lapsed). */
  isActive: boolean;
}

/** What a checkout returns: either a redirect (card) or a pending push (mobile money). */
export interface CheckoutResult {
  paymentId: string;
  provider: PaymentProvider;
  status: 'redirect' | 'pending' | 'succeeded';
  /** Where to send the reader (Stripe Checkout). */
  redirectUrl?: string;
  /** Human note for mobile money ("approve the prompt on your phone"). */
  message?: string;
}
