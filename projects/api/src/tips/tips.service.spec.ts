import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { TipsService } from './tips.service';

function build() {
  const prisma = {
    tip: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  };
  return { service: new TipsService(prisma as unknown as PrismaService), prisma };
}

describe('TipsService', () => {
  describe('submit', () => {
    it('stores a stripped message + optional contact', async () => {
      const { service, prisma } = build();
      prisma.tip.create.mockResolvedValue({});
      expect(await service.submit('  <b>Corruption</b> at the ministry ', 'me@x.com')).toEqual({
        received: true,
      });
      const arg = prisma.tip.create.mock.calls[0][0] as { data: { message: string } };
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
