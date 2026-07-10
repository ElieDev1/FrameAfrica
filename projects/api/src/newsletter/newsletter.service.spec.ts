import type { PrismaService } from '../prisma/prisma.service';
import { NewsletterService } from './newsletter.service';

function build() {
  const prisma = {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return { service: new NewsletterService(prisma as unknown as PrismaService), prisma };
}

describe('NewsletterService', () => {
  describe('subscribe', () => {
    it('creates a new confirmed subscriber with an unsubscribe token', async () => {
      const { service, prisma } = build();
      prisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
      prisma.newsletterSubscriber.create.mockResolvedValue({});
      expect(await service.subscribe('  ME@Example.com ')).toEqual({ subscribed: true });
      const arg = prisma.newsletterSubscriber.create.mock.calls[0][0] as {
        data: { email: string; unsubscribeToken: string; confirmedAt: Date };
      };
      expect(arg.data.email).toBe('me@example.com');
      expect(arg.data.unsubscribeToken).toHaveLength(48);
      expect(arg.data.confirmedAt).toBeInstanceOf(Date);
    });

    it('resubscribes a previously unsubscribed email', async () => {
      const { service, prisma } = build();
      prisma.newsletterSubscriber.findUnique.mockResolvedValue({
        email: 'a@b.com',
        confirmedAt: new Date('2026-01-01'),
        unsubscribedAt: new Date('2026-02-01'),
      });
      await service.subscribe('a@b.com');
      const arg = prisma.newsletterSubscriber.update.mock.calls[0][0] as {
        data: { unsubscribedAt: null };
      };
      expect(arg.data.unsubscribedAt).toBeNull();
      expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('reports success only when a row was updated', async () => {
      const { service, prisma } = build();
      prisma.newsletterSubscriber.updateMany.mockResolvedValue({ count: 1 });
      expect(await service.unsubscribe('tok')).toEqual({ unsubscribed: true });
      prisma.newsletterSubscriber.updateMany.mockResolvedValue({ count: 0 });
      expect(await service.unsubscribe('bad')).toEqual({ unsubscribed: false });
    });
  });
});
