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
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
});
