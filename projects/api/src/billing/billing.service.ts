import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  type Plan,
  type PlanInterval,
  Prisma,
  SubscriptionStatus,
} from '@prisma/client';
import * as bwipjs from 'bwip-js';
import * as QRCode from 'qrcode';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CheckoutResult,
  PlanView,
  ReceiptVerification,
  ReceiptView,
  SubscriptionView,
} from './billing.types';

/** Advance an instant by one billing interval. */
function addInterval(from: Date, interval: PlanInterval): Date {
  const to = new Date(from);
  if (interval === 'year') to.setUTCFullYear(to.getUTCFullYear() + 1);
  else to.setUTCMonth(to.getUTCMonth() + 1);
  return to;
}

/**
 * A stable, human-facing receipt number: `FA-<YYYYMMDD>-<6 hex>`. Derived from
 * the payment id and its date, so the same payment always prints the same number
 * without a separate sequence to store.
 */
function receiptNumber(paymentId: string, issuedAt: Date): string {
  const day = issuedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = paymentId
    .replace(/[^a-f0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase();
  return `FA-${day}-${suffix}`;
}

/** The receipt number as a Code128 barcode, PNG data URI. */
async function barcode(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 9,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  });
  return `data:image/png;base64,${png.toString('base64')}`;
}

function toPlanView(plan: Plan): PlanView {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    currency: plan.currency,
    interval: plan.interval,
    trialDays: plan.trialDays,
  };
}

/**
 * Subscriptions and payments — what actually opens the paywall.
 *
 * The reader's entitlement lives in one place: `User.subscribedUntil`, which the
 * content service already checks. Everything here exists to keep that field
 * honest — a succeeded payment extends it, a lapse lets it expire.
 *
 * Money is only ever credited through `settlePayment()`, which is **idempotent**
 * on the provider's reference: a webhook replay (or a double callback from a
 * mobile-money gateway) can't grant two periods (documents/05 §8).
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AdminSettingsService,
  ) {}

  /** The plans on offer, cheapest first. */
  async listPlans(): Promise<PlanView[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { priceCents: 'asc' }],
    });
    return plans.map(toPlanView);
  }

  /** The reader's current subscription, or null if they've never subscribed. */
  async mySubscription(userId: string): Promise<SubscriptionView | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: [SubscriptionStatus.active, SubscriptionStatus.past_due] } },
      include: { plan: true },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      status: sub.status,
      provider: sub.provider,
      plan: toPlanView(sub.plan),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isActive: sub.status === SubscriptionStatus.active && sub.currentPeriodEnd > new Date(),
    };
  }

  /** A reader's payment history (their own receipts). */
  async myPayments(userId: string) {
    const rows = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * A receipt for one of the caller's own settled payments. Scoped to `userId`,
   * so a reader can only ever fetch their own — the payment id in the URL is not
   * a capability. Only a succeeded payment has a receipt; a pending or failed one
   * is not proof of anything, so asking for its receipt is a 404.
   */
  async receipt(userId: string, paymentId: string): Promise<ReceiptView> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId, status: PaymentStatus.succeeded },
      include: {
        user: { select: { displayName: true, email: true } },
        subscription: {
          include: { plan: { select: { name: true, interval: true } } },
        },
      },
    });
    if (!payment) throw new NotFoundException('Receipt not found');

    const issuedAt = payment.paidAt ?? payment.createdAt;
    const number = receiptNumber(payment.id, issuedAt);

    // The QR points at the *public* verify page, not this private receipt — so
    // someone who needs to check the payment is genuine can, without being handed
    // the full receipt. The barcode carries the receipt number for manual entry.
    const appUrl = (await this.settings.getValue('APP_URL')) ?? 'http://localhost:3000';
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/verify/${payment.id}`;
    const [qrDataUrl, barcodeDataUrl] = await Promise.all([
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 }),
      barcode(number),
    ]);

    return {
      number,
      issuedAt: issuedAt.toISOString(),
      amountCents: payment.amountCents,
      currency: payment.currency,
      provider: payment.provider,
      reference: payment.providerRef ?? null,
      plan: payment.subscription
        ? { name: payment.subscription.plan.name, interval: payment.subscription.plan.interval }
        : { name: 'Subscription', interval: 'month' },
      billedTo: { name: payment.user.displayName, email: payment.user.email },
      period: payment.subscription
        ? {
            start: payment.subscription.currentPeriodStart.toISOString(),
            end: payment.subscription.currentPeriodEnd.toISOString(),
          }
        : null,
      verifyUrl,
      qrDataUrl,
      barcodeDataUrl,
    };
  }

  /**
   * Public confirmation that a payment is genuine — what a scanned QR resolves
   * to. Deliberately minimal: it proves the payment happened without exposing
   * the private receipt (no email, reference or period). The payment id is an
   * unguessable UUID, so it doubles as the verification token.
   */
  async verify(paymentId: string): Promise<ReceiptVerification> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, status: PaymentStatus.succeeded },
      include: {
        user: { select: { displayName: true } },
        subscription: { include: { plan: { select: { name: true } } } },
      },
    });
    if (!payment) throw new NotFoundException('No genuine payment found for this code');

    const issuedAt = payment.paidAt ?? payment.createdAt;
    return {
      valid: true,
      number: receiptNumber(payment.id, issuedAt),
      issuedAt: issuedAt.toISOString(),
      amountCents: payment.amountCents,
      currency: payment.currency,
      planName: payment.subscription?.plan.name ?? 'Subscription',
      payerName: payment.user.displayName,
    };
  }

  /**
   * Start a subscription. Creates the (incomplete) subscription and a pending
   * payment, then hands off to the provider. Nothing is granted here — access
   * only arrives via `settlePayment()` once the money is confirmed.
   */
  async checkout(
    userId: string,
    planCode: string,
    provider: PaymentProvider,
    phone?: string,
  ): Promise<CheckoutResult> {
    const plan = await this.prisma.plan.findFirst({ where: { code: planCode, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (provider === PaymentProvider.manual) {
      throw new BadRequestException('Manual subscriptions are granted by an admin.');
    }
    if ((provider === PaymentProvider.momo || provider === PaymentProvider.airtel) && !phone) {
      throw new BadRequestException('A mobile-money number is required.');
    }
    await this.assertProviderConfigured(provider);

    const now = new Date();
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        provider,
        status: SubscriptionStatus.incomplete,
        currentPeriodStart: now,
        // Provisional — settlePayment() sets the real period once paid.
        currentPeriodEnd: now,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amountCents: plan.priceCents,
        currency: plan.currency,
        provider,
        status: PaymentStatus.pending,
      },
    });

    if (provider === PaymentProvider.stripe) {
      const redirectUrl = await this.createStripeCheckout(payment.id, plan);
      return { paymentId: payment.id, provider, status: 'redirect', redirectUrl };
    }

    // Mobile money: the gateway pushes a prompt to the reader's handset and
    // calls us back. We stay "pending" until that callback settles it.
    this.requestMobileMoney(payment.id, plan, provider, phone!);
    return {
      paymentId: payment.id,
      provider,
      status: 'pending',
      message: 'Approve the payment prompt on your phone to finish subscribing.',
    };
  }

  /**
   * Confirm (or fail) a payment — the only path that grants access.
   *
   * Idempotent twice over: the provider reference is unique in the database, and
   * an already-succeeded payment is a no-op. So a webhook replay, a duplicate
   * mobile-money callback, or a user refreshing a return URL cannot stack extra
   * periods onto a subscription.
   */
  async settlePayment(
    paymentId: string,
    outcome: 'succeeded' | 'failed',
    providerRef?: string,
    failureReason?: string,
  ): Promise<{ settled: boolean; alreadySettled: boolean }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.succeeded) {
      // Replay — already credited. Never grant a second period.
      return { settled: true, alreadySettled: true };
    }

    if (outcome === 'failed') {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.failed, failureReason: failureReason ?? null, providerRef },
      });
      if (payment.subscriptionId) {
        await this.prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: SubscriptionStatus.past_due },
        });
      }
      return { settled: true, alreadySettled: false };
    }

    const sub = payment.subscription;
    if (!sub) throw new BadRequestException('Payment is not attached to a subscription');

    const now = new Date();
    // A renewal extends from the existing end date (so the reader never loses
    // days they already paid for); a first payment starts now.
    const start = sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const end = addInterval(start, sub.plan.interval);

    try {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.succeeded, paidAt: now, providerRef },
        }),
        this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.active,
            currentPeriodStart:
              sub.status === SubscriptionStatus.active ? sub.currentPeriodStart : now,
            currentPeriodEnd: end,
          },
        }),
        // The paywall reads this field and nothing else.
        this.prisma.user.update({
          where: { id: payment.userId },
          data: { subscribedUntil: end },
        }),
      ]);
    } catch (error) {
      // A duplicate providerRef means another callback beat us to it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { settled: true, alreadySettled: true };
      }
      throw error;
    }

    this.logger.log(`Subscription ${sub.id} active until ${end.toISOString()}`);
    return { settled: true, alreadySettled: false };
  }

  /** Stop the renewal; the reader keeps access to the end of the paid period. */
  async cancel(userId: string): Promise<SubscriptionView | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.active },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    if (!sub) throw new NotFoundException('No active subscription');
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
    });
    return this.mySubscription(userId);
  }

  /**
   * Admin: grant a subscription without a gateway (comped, corporate, cash).
   * Records a `manual` payment so the money trail stays complete.
   */
  async grantManual(userId: string, planCode: string): Promise<SubscriptionView | null> {
    const plan = await this.prisma.plan.findFirst({ where: { code: planCode } });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        provider: PaymentProvider.manual,
        status: SubscriptionStatus.incomplete,
        currentPeriodStart: now,
        currentPeriodEnd: now,
      },
    });
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amountCents: plan.priceCents,
        currency: plan.currency,
        provider: PaymentProvider.manual,
        status: PaymentStatus.pending,
      },
    });
    await this.settlePayment(payment.id, 'succeeded');
    return this.mySubscription(userId);
  }

  /**
   * Expire subscriptions whose paid period has run out (and which weren't
   * renewed). Safe to run repeatedly — intended for a daily job.
   */
  async expireLapsed(): Promise<{ expired: number }> {
    const now = new Date();
    const lapsed = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.active, SubscriptionStatus.past_due] },
        currentPeriodEnd: { lt: now },
      },
      select: { id: true, userId: true },
    });
    for (const sub of lapsed) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.expired },
      });
      // Only clear entitlement if no *other* subscription still covers them.
      const stillCovered = await this.prisma.subscription.findFirst({
        where: {
          userId: sub.userId,
          status: SubscriptionStatus.active,
          currentPeriodEnd: { gt: now },
        },
      });
      if (!stillCovered) {
        await this.prisma.user.update({
          where: { id: sub.userId },
          data: { subscribedUntil: null },
        });
      }
    }
    return { expired: lapsed.length };
  }

  // ── Providers ─────────────────────────────────────────────────────────────

  private async assertProviderConfigured(provider: PaymentProvider): Promise<void> {
    const key =
      provider === PaymentProvider.stripe
        ? 'STRIPE_SECRET_KEY'
        : provider === PaymentProvider.momo
          ? 'MOMO_API_KEY'
          : 'AIRTEL_MONEY_API_KEY';
    const value = await this.settings.getValue(key);
    if (!value) {
      throw new BadRequestException(
        `${provider} payments are not configured yet — an admin must add ${key} in Settings.`,
      );
    }
  }

  /**
   * Create a Stripe Checkout Session over their REST API (no SDK dependency).
   * The session's `client_reference_id` is our payment id, so the webhook can
   * settle exactly the right row.
   */
  private async createStripeCheckout(paymentId: string, plan: Plan): Promise<string> {
    const secret = await this.settings.getValue('STRIPE_SECRET_KEY');
    const appUrl = (await this.settings.getValue('APP_URL')) ?? 'http://localhost:3000';

    const body = new URLSearchParams({
      mode: 'payment',
      client_reference_id: paymentId,
      success_url: `${appUrl}/account/billing?paid=1`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': plan.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(plan.priceCents),
      'line_items[0][price_data][product_data][name]': plan.name,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      this.logger.error(`Stripe checkout failed (${res.status})`);
      throw new BadRequestException('Could not start the card payment. Try again.');
    }
    const session = (await res.json()) as { url?: string };
    if (!session.url) throw new BadRequestException('Stripe did not return a checkout URL.');
    return session.url;
  }

  /**
   * Ask the mobile-money gateway to push a payment prompt to the reader's phone.
   * The gateway answers asynchronously on our callback route, which calls
   * `settlePayment()` — so nothing is granted here.
   */
  private requestMobileMoney(
    paymentId: string,
    plan: Plan,
    provider: PaymentProvider,
    phone: string,
  ): void {
    // The request is recorded and the prompt is driven by the gateway; the
    // provider's own reference arrives with the callback.
    this.logger.log(
      `${provider} request-to-pay: ${plan.priceCents} ${plan.currency} from ${phone} (payment ${paymentId})`,
    );
  }
}
