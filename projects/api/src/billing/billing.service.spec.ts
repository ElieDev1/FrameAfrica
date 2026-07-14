import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AdminSettingsService } from '../admin/admin-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';

const MONTHLY_PLAN = {
  id: 'plan-1',
  code: 'digital-monthly',
  name: 'Digital monthly',
  description: null,
  priceCents: 5000,
  currency: 'RWF',
  interval: 'month' as const,
  trialDays: 0,
  isActive: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function build(settings: Record<string, string> = {}) {
  const prisma = {
    plan: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
    subscription: {
      create: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: { update: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const adminSettings = { getValue: jest.fn((k: string) => Promise.resolve(settings[k] ?? null)) };
  const service = new BillingService(
    prisma as unknown as PrismaService,
    adminSettings as unknown as AdminSettingsService,
  );
  return { service, prisma, adminSettings };
}

/** A pending payment attached to a fresh (never-paid) subscription. */
function pendingPayment(over: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'pay-1',
    userId: 'u1',
    subscriptionId: 'sub-1',
    amountCents: 5000,
    currency: 'RWF',
    provider: 'momo',
    status: 'pending',
    subscription: {
      id: 'sub-1',
      status: 'incomplete',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      plan: MONTHLY_PLAN,
    },
    ...over,
  };
}

describe('BillingService', () => {
  describe('checkout', () => {
    it('refuses a provider the admin has not configured', async () => {
      const { service, prisma } = build(); // no keys set
      prisma.plan.findFirst.mockResolvedValue(MONTHLY_PLAN);

      await expect(
        service.checkout('u1', 'digital-monthly', 'momo', '+250788000000'),
      ).rejects.toBeInstanceOf(BadRequestException);
      // Nothing may be created when we can't actually take money.
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('requires a phone number for mobile money', async () => {
      const { service, prisma } = build({ MOMO_API_KEY: 'k' });
      prisma.plan.findFirst.mockResolvedValue(MONTHLY_PLAN);

      await expect(service.checkout('u1', 'digital-monthly', 'momo')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown plan', async () => {
      const { service, prisma } = build({ MOMO_API_KEY: 'k' });
      prisma.plan.findFirst.mockResolvedValue(null);

      await expect(service.checkout('u1', 'nope', 'momo', '+250788000000')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('creates a pending payment and grants nothing yet', async () => {
      const { service, prisma } = build({ MOMO_API_KEY: 'k' });
      prisma.plan.findFirst.mockResolvedValue(MONTHLY_PLAN);
      prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });

      const res = await service.checkout('u1', 'digital-monthly', 'momo', '+250788000000');

      expect(res.status).toBe('pending');
      const sub = (prisma.subscription.create.mock.calls[0] as [{ data: { status: string } }])[0];
      expect(sub.data.status).toBe('incomplete');
      const pay = (prisma.payment.create.mock.calls[0] as [{ data: { status: string } }])[0];
      expect(pay.data.status).toBe('pending');
      // Access is never granted at checkout — only settlement does that.
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('settlePayment', () => {
    it('grants access by extending subscribedUntil to the period end', async () => {
      const { service, prisma } = build();
      prisma.payment.findUnique.mockResolvedValue(pendingPayment());

      await service.settlePayment('pay-1', 'succeeded', 'momo-ref-1');

      const ops = (prisma.$transaction.mock.calls[0] as [unknown[]])[0];
      expect(ops).toHaveLength(3); // payment + subscription + user entitlement
      // The user's entitlement is written — this is what the paywall reads.
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const call = (
        prisma.user.update.mock.calls[0] as [
          { where: { id: string }; data: { subscribedUntil: Date } },
        ]
      )[0];
      expect(call.where).toEqual({ id: 'u1' });
      const { data } = call;
      expect(data.subscribedUntil).toBeInstanceOf(Date);
      // A monthly plan lands roughly a month out, not in the past.
      expect(data.subscribedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it('is idempotent — a replayed webhook cannot grant a second period', async () => {
      const { service, prisma } = build();
      prisma.payment.findUnique.mockResolvedValue(pendingPayment({ status: 'succeeded' }));

      const res = await service.settlePayment('pay-1', 'succeeded', 'momo-ref-1');

      expect(res).toEqual({ settled: true, alreadySettled: true });
      // Crucially: no entitlement is written a second time.
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('treats a duplicate provider reference as an already-settled replay', async () => {
      const { service, prisma } = build();
      prisma.payment.findUnique.mockResolvedValue(pendingPayment());
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 't' }),
      );

      const res = await service.settlePayment('pay-1', 'succeeded', 'momo-ref-1');
      expect(res).toEqual({ settled: true, alreadySettled: true });
    });

    it('renews from the existing period end, so paid-for days are never lost', async () => {
      const { service, prisma } = build();
      const endsIn10Days = new Date(Date.now() + 10 * 86_400_000);
      prisma.payment.findUnique.mockResolvedValue(
        pendingPayment({
          subscription: {
            id: 'sub-1',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: endsIn10Days,
            plan: MONTHLY_PLAN,
          },
        }),
      );

      await service.settlePayment('pay-1', 'succeeded', 'ref-2');

      const { data } = (
        prisma.user.update.mock.calls[0] as [{ data: { subscribedUntil: Date } }]
      )[0];
      // Extends from the remaining 10 days, not from today.
      expect(data.subscribedUntil.getTime()).toBeGreaterThan(endsIn10Days.getTime());
    });

    it('marks a failure past_due and grants nothing', async () => {
      const { service, prisma } = build();
      prisma.payment.findUnique.mockResolvedValue(pendingPayment());

      await service.settlePayment('pay-1', 'failed', undefined, 'Insufficient funds');

      expect(prisma.user.update).not.toHaveBeenCalled();
      const sub = (prisma.subscription.update.mock.calls[0] as [{ data: { status: string } }])[0];
      expect(sub.data.status).toBe('past_due');
    });
  });

  describe('expireLapsed', () => {
    it('clears entitlement once the paid period has run out', async () => {
      const { service, prisma } = build();
      prisma.subscription.findMany.mockResolvedValue([{ id: 'sub-1', userId: 'u1' }]);
      prisma.subscription.findFirst.mockResolvedValue(null); // nothing else covers them

      const res = await service.expireLapsed();

      expect(res.expired).toBe(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { subscribedUntil: null },
      });
    });

    it('keeps entitlement when another subscription still covers the reader', async () => {
      const { service, prisma } = build();
      prisma.subscription.findMany.mockResolvedValue([{ id: 'old', userId: 'u1' }]);
      prisma.subscription.findFirst.mockResolvedValue({ id: 'current' });

      await service.expireLapsed();

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('receipt', () => {
    const settledPayment = {
      id: 'a1b2c3d4e5f6',
      userId: 'u1',
      amountCents: 5000,
      currency: 'RWF',
      provider: 'momo',
      providerRef: 'MOMO-REF-9',
      status: 'succeeded',
      paidAt: new Date('2026-07-14T09:00:00Z'),
      createdAt: new Date('2026-07-14T08:59:00Z'),
      user: { displayName: 'Jane Uwase', email: 'jane@frameafrica.rw' },
      subscription: {
        currentPeriodStart: new Date('2026-07-14T09:00:00Z'),
        currentPeriodEnd: new Date('2026-08-14T09:00:00Z'),
        plan: { name: 'Digital monthly', interval: 'month' },
      },
    };

    it('builds a receipt for a settled payment, made out to the reader', async () => {
      const { service, prisma } = build({ APP_URL: 'https://frameafrica.rw' });
      prisma.payment.findFirst.mockResolvedValue(settledPayment);

      const receipt = await service.receipt('u1', 'a1b2c3d4e5f6');

      expect(receipt.number).toBe('FA-20260714-A1B2C3'); // stable, date + id
      expect(receipt.amountCents).toBe(5000);
      expect(receipt.billedTo).toEqual({ name: 'Jane Uwase', email: 'jane@frameafrica.rw' });
      expect(receipt.plan.name).toBe('Digital monthly');
      expect(receipt.period).toEqual({
        start: '2026-07-14T09:00:00.000Z',
        end: '2026-08-14T09:00:00.000Z',
      });
      // The QR points at the *public* verify page, not the private receipt.
      expect(receipt.verifyUrl).toBe('https://frameafrica.rw/verify/a1b2c3d4e5f6');
      expect(receipt.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      // And the receipt number is carried as a scannable barcode.
      expect(receipt.barcodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('only queries the caller’s own succeeded payments — the id is not a capability', async () => {
      const { service, prisma } = build();
      prisma.payment.findFirst.mockResolvedValue(settledPayment);

      await service.receipt('u1', 'a1b2c3d4e5f6');

      const calls = prisma.payment.findFirst.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: { id: string; userId: string; status: string } };
      expect(arg.where).toMatchObject({ id: 'a1b2c3d4e5f6', userId: 'u1', status: 'succeeded' });
    });

    it('404s a payment that is not the caller’s, or not settled', async () => {
      const { service, prisma } = build();
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.receipt('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listSubscriptions (admin)', () => {
    it('lists subscribers with user + plan, excluding never-settled ones', async () => {
      const { service, prisma } = build();
      prisma.subscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          status: 'active',
          provider: 'momo',
          currentPeriodEnd: new Date('2026-08-14T00:00:00Z'),
          cancelAtPeriodEnd: false,
          user: { id: 'u1', displayName: 'Jane Uwase', email: 'jane@frameafrica.rw' },
          plan: { name: 'Digital monthly' },
        },
      ]);

      const list = await service.listSubscriptions();

      expect(list[0]).toMatchObject({
        id: 'sub-1',
        user: { name: 'Jane Uwase', email: 'jane@frameafrica.rw' },
        planName: 'Digital monthly',
        isActive: true,
      });
      const findManyCalls = prisma.subscription.findMany.mock.calls as unknown[][];
      const findManyArg = findManyCalls[0]?.[0] as { where: { status: unknown } };
      expect(findManyArg.where.status).toEqual({ not: 'incomplete' }); // never-settled left out
    });
  });

  describe('revoke (admin)', () => {
    it('ends the subscription now and clears entitlement when nothing else covers', async () => {
      const { service, prisma } = build();
      prisma.subscription.findUnique.mockResolvedValue({ id: 'sub-1', userId: 'u1' });
      prisma.subscription.findFirst.mockResolvedValue(null); // no other coverage

      const res = await service.revoke('sub-1');

      expect(res).toEqual({ revoked: true });
      const updateCalls = prisma.subscription.update.mock.calls as unknown[][];
      const upd = (updateCalls[0]?.[0] as { data: { status: string } }).data;
      expect(upd.status).toBe('canceled');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { subscribedUntil: null },
      });
    });

    it('keeps entitlement when another subscription still covers the reader', async () => {
      const { service, prisma } = build();
      prisma.subscription.findUnique.mockResolvedValue({ id: 'sub-1', userId: 'u1' });
      prisma.subscription.findFirst.mockResolvedValue({ id: 'sub-2' });

      await service.revoke('sub-1');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('404s an unknown subscription', async () => {
      const { service, prisma } = build();
      prisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.revoke('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('verify (public)', () => {
    it('confirms a genuine payment without exposing private detail', async () => {
      const { service, prisma } = build();
      prisma.payment.findFirst.mockResolvedValue({
        id: 'a1b2c3d4e5f6',
        amountCents: 5000,
        currency: 'RWF',
        paidAt: new Date('2026-07-14T09:00:00Z'),
        createdAt: new Date('2026-07-14T08:59:00Z'),
        user: { displayName: 'Jane Uwase' },
        subscription: { plan: { name: 'Digital monthly' } },
      });

      const v = await service.verify('a1b2c3d4e5f6');

      expect(v).toEqual({
        valid: true,
        number: 'FA-20260714-A1B2C3',
        issuedAt: '2026-07-14T09:00:00.000Z',
        amountCents: 5000,
        currency: 'RWF',
        planName: 'Digital monthly',
        payerName: 'Jane Uwase',
      });
      // No email, reference or period leak through verification.
      expect(v).not.toHaveProperty('billedTo');
      expect(v).not.toHaveProperty('reference');
    });

    it('looks up any succeeded payment by id — verification is not user-scoped', async () => {
      const { service, prisma } = build();
      prisma.payment.findFirst.mockResolvedValue({
        id: 'x',
        amountCents: 5000,
        currency: 'RWF',
        paidAt: new Date('2026-07-14T09:00:00Z'),
        createdAt: new Date('2026-07-14T09:00:00Z'),
        user: { displayName: 'Jane' },
        subscription: null,
      });

      await service.verify('x');

      const calls = prisma.payment.findFirst.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(arg.where).toEqual({ id: 'x', status: 'succeeded' }); // no userId — anyone can verify
    });

    it('404s an unknown or unsettled code', async () => {
      const { service, prisma } = build();
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.verify('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
