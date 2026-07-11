import { BadRequestException } from '@nestjs/common';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import { TipsService } from './tips.service';

function build() {
  const prisma = {
    tip: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  };
  const notifications = { notifyRoles: jest.fn() };
  return {
    service: new TipsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    ),
    prisma,
    notifications,
  };
}

/** First argument of a jest mock's first call, typed. */
function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('TipsService', () => {
  describe('submit', () => {
    it('stores a stripped message + optional contact', async () => {
      const { service, prisma } = build();
      prisma.tip.create.mockResolvedValue({});
      expect(await service.submit('  <b>Corruption</b> at the ministry ', 'me@x.com')).toEqual({
        received: true,
      });
      const arg = firstArg<{ data: { message: string } }>(prisma.tip.create);
      expect(arg.data.message).toBe('Corruption at the ministry');
    });

    it('rejects an empty message', async () => {
      const { service } = build();
      await expect(service.submit('   ')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('list', () => {
    it('maps rows newest-first', async () => {
      const { service, prisma } = build();
      prisma.tip.findMany.mockResolvedValue([
        {
          id: 't1',
          message: 'Tip',
          contact: null,
          status: 'new',
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ]);
      const res = await service.list();
      expect(res[0]).toMatchObject({
        id: 't1',
        status: 'new',
        createdAt: '2026-02-01T00:00:00.000Z',
      });
    });
  });
});
