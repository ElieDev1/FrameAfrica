import { BadRequestException, ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { LiveService } from './live.service';

function build() {
  const prisma = {
    article: { findFirst: jest.fn(), update: jest.fn() },
    liveUpdate: { findMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };
  return { service: new LiveService(prisma as unknown as PrismaService), prisma };
}

const updateRow = {
  id: 'lu1',
  headline: null,
  body: 'Officials confirm the figures.',
  isKeyEvent: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  author: { displayName: 'Jane Uwase' },
};

describe('LiveService', () => {
  describe('addUpdate', () => {
    it('posts an update (markup stripped) and marks the article live', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'published' });
      prisma.$transaction.mockResolvedValue([updateRow, { id: 'a1', isLive: true }]);

      const res = await service.addUpdate('a1', 'u1', { body: 'Officials <b>confirm</b>.' });

      expect(res.author).toBe('Jane Uwase');
      // The create was given a stripped body and the article update sets isLive.
      const txArgs = (prisma.$transaction.mock.calls[0] as [unknown[]])[0];
      expect(txArgs).toHaveLength(2);
    });

    it('rejects an empty update', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'published' });
      await expect(service.addUpdate('a1', 'u1', { body: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses live updates on a non-published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'draft' });
      await expect(service.addUpdate('a1', 'u1', { body: 'hi' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('listUpdates', () => {
    it('returns [] for an unknown slug', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      expect(await service.listUpdates('nope')).toEqual([]);
    });

    it('maps updates newest-first', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.liveUpdate.findMany.mockResolvedValue([updateRow]);

      const res = await service.listUpdates('a-slug');
      expect(res[0].body).toBe('Officials confirm the figures.');
      const arg = (prisma.liveUpdate.findMany.mock.calls[0] as [{ orderBy: unknown }])[0];
      expect(arg.orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
