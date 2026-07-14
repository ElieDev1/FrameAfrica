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

/** A downloadable receipt for one settled payment. */
export interface ReceiptView {
  /** Human-facing receipt number, stable for this payment (e.g. FA-20260714-3F2A9C). */
  number: string;
  issuedAt: string;
  amountCents: number;
  currency: string;
  provider: PaymentProvider;
  /** The gateway's own reference for the payment, when there is one. */
  reference: string | null;
  plan: { name: string; interval: PlanInterval };
  /** Who the receipt is made out to. */
  billedTo: { name: string; email: string };
  /** The access period this payment covers, when it maps to a subscription. */
  period: { start: string; end: string } | null;
  /** A link back to this receipt, and that link as a scannable QR (a data: URI). */
  verifyUrl: string;
  qrDataUrl: string;
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
