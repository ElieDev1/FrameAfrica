import type { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

function build() {
  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return { service: new NotificationsService(prisma as unknown as PrismaService), prisma };
}

describe('NotificationsService', () => {
  describe('create', () => {
    it('persists a notification', async () => {
      const { service, prisma } = build();
      prisma.notification.create.mockResolvedValue({});
      await service.create({ userId: 'u1', type: 'article_published', title: 'Live' });
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('never throws (best-effort) when the write fails', async () => {
      const { service, prisma } = build();
      prisma.notification.create.mockRejectedValue(new Error('db down'));
      await expect(
        service.create({ userId: 'u1', type: 'article_returned', title: 'Fix' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('list', () => {
    it('maps rows and derives read from readAt', async () => {
      const { service, prisma } = build();
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 'n1',
          type: 'article_published',
          title: 'Live',
          body: null,
          link: '/article/x',
          readAt: null,
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
        {
          id: 'n2',
          type: 'article_returned',
          title: 'Fix',
          body: 'note',
          link: '/dashboard/stories/x',
          readAt: new Date('2026-02-02T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ]);
      const res = await service.list('u1');
      expect(res[0].read).toBe(false);
      expect(res[1].read).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('marks unread as read and returns the count', async () => {
      const { service, prisma } = build();
      prisma.notification.updateMany.mockResolvedValue({ count: 4 });
      expect(await service.markAllRead('u1')).toEqual({ marked: 4 });
    });
  });
});
