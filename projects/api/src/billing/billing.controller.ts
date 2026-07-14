import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentProvider, RoleName } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { apiResponse } from '../common/http/api-response';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { GrantSubscriptionDto } from './dto/grant.dto';

/** Public: the plans on offer. The pricing page reads this without a session. */
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly settings: AdminSettingsService,
  ) {}

  @Get('plans')
  async plans() {
    return apiResponse(await this.billing.listPlans());
  }

  /**
   * Public receipt verification — no session. A third party who scans a receipt's
   * QR lands here to confirm the payment is genuine, without being handed the
   * private receipt. The id is an unguessable UUID, so it acts as the token.
   */
  @Get('verify/:id')
  async verify(@Param('id') id: string) {
    return apiResponse(await this.billing.verify(id));
  }
}

/** The reader's own billing — always scoped to the caller, never to an id. */
@Controller('billing/me')
@UseGuards(JwtAuthGuard)
export class BillingMeController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  async subscription(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.billing.mySubscription(user.id));
  }

  @Get('payments')
  async payments(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.billing.myPayments(user.id));
  }

  /** The receipt for one settled payment — scoped to the caller. */
  @Get('payments/:id/receipt')
  async receipt(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return apiResponse(await this.billing.receipt(user.id, id));
  }

  @Post('checkout')
  @HttpCode(200)
  async checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return apiResponse(await this.billing.checkout(user.id, dto.planCode, dto.provider, dto.phone));
  }

  @Post('cancel')
  @HttpCode(200)
  async cancel(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.billing.cancel(user.id));
  }
}

/** Just enough of the Express request for a webhook (typed locally so the
 *  decorated signature doesn't drag Express types through emitDecoratorMetadata). */
interface WebhookRequest {
  headers: Record<string, string | string[] | undefined>;
  rawBody?: Buffer;
  body?: unknown;
}

interface StripeEvent {
  type?: string;
  data?: { object?: { client_reference_id?: string; id?: string } };
}

/**
 * Verify a Stripe webhook signature: an HMAC-SHA256 over `timestamp.payload`,
 * compared in constant time. Without this, anyone who knew the URL could POST a
 * "payment succeeded" and hand themselves a free subscription.
 */
function stripeSignatureValid(raw: Buffer, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k?.trim(), v?.trim()];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;

  const expected = createHmac('sha256', secret)
    .update(`${parts.t}.${raw.toString('utf8')}`)
    .digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(parts.v1, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Gateway callbacks. Unauthenticated by nature — the gateway has no session —
 * so each one is verified before it's trusted, and settlement is idempotent so a
 * replay can't grant a second period (documents/05 §8).
 */
@Controller('billing/webhooks')
export class BillingWebhookController {
  constructor(
    private readonly billing: BillingService,
    private readonly settings: AdminSettingsService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async stripe(@Req() req: WebhookRequest) {
    const secret = await this.settings.getValue('STRIPE_WEBHOOK_SECRET');
    const signature = req.headers['stripe-signature'];

    // Refuse to act on anything we can't verify — an unverified caller must
    // never be able to grant a subscription.
    if (!secret || typeof signature !== 'string' || !req.rawBody) {
      return apiResponse({ ignored: true, reason: 'unverified' });
    }
    if (!stripeSignatureValid(req.rawBody, signature, secret)) {
      return apiResponse({ ignored: true, reason: 'bad signature' });
    }

    const event = req.body as StripeEvent;
    const paymentId = event?.data?.object?.client_reference_id;
    if (event?.type !== 'checkout.session.completed' || !paymentId) {
      return apiResponse({ ignored: true });
    }
    return apiResponse(
      await this.billing.settlePayment(paymentId, 'succeeded', event.data?.object?.id),
    );
  }

  /**
   * Mobile-money callback (MTN MoMo / Airtel). The gateway posts the outcome of
   * the prompt it pushed to the reader's handset.
   */
  @Post(':provider')
  @HttpCode(200)
  async mobileMoney(
    @Param('provider') provider: string,
    @Body() body: { paymentId?: string; status?: string; reference?: string; reason?: string },
  ) {
    if (provider !== PaymentProvider.momo && provider !== PaymentProvider.airtel) {
      return apiResponse({ ignored: true, reason: 'unknown provider' });
    }
    if (!body.paymentId) return apiResponse({ ignored: true, reason: 'no payment' });

    const succeeded = body.status === 'SUCCESSFUL' || body.status === 'succeeded';
    const result = await this.billing.settlePayment(
      body.paymentId,
      succeeded ? 'succeeded' : 'failed',
      body.reference,
      succeeded ? undefined : (body.reason ?? 'Payment was not completed'),
    );
    return apiResponse(result);
  }
}

/** Admin: comped / corporate / cash subscriptions, and the lapse sweep. */
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class BillingAdminController {
  constructor(private readonly billing: BillingService) {}

  @Post('grant')
  @HttpCode(200)
  async grant(@Body() dto: GrantSubscriptionDto) {
    return apiResponse(await this.billing.grantManual(dto.userId, dto.planCode));
  }

  @Get('subscriptions')
  async subscriptions() {
    return apiResponse(await this.billing.listSubscriptions());
  }

  @Post('subscriptions/:id/revoke')
  @HttpCode(200)
  async revoke(@Param('id') id: string) {
    return apiResponse(await this.billing.revoke(id));
  }

  @Post('expire-lapsed')
  @HttpCode(200)
  async expire() {
    return apiResponse(await this.billing.expireLapsed());
  }
}
