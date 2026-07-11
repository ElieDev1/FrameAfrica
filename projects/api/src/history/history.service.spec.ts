import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from './history.service';

function build() {
  const prisma = {
    readingHistory: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    article: { findFirst: jest.fn() },
  };
  return { service: new HistoryService(prisma as unknown as PrismaService), prisma };
}

describe('HistoryService', () => {
  describe('record', () => {
    it('upserts a published article, bumping viewedAt', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.readingHistory.upsert.mockResolvedValue({});

      expect(await service.record('u1', 'a1')).toEqual({ recorded: true });
      const arg = (
        prisma.readingHistory.upsert.mock.calls[0] as [{ update: { viewedAt: Date } }]
      )[0];
      expect(arg.update.viewedAt).toBeInstanceOf(Date);
    });

    it('404s an unpublished/unknown article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.record('u1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('maps history newest-first with viewedAt', async () => {
      const { service, prisma } = build();
      prisma.readingHistory.findMany.mockResolvedValue([
        {
          viewedAt: new Date('2026-02-01T00:00:00Z'),
          article: {
            id: 'a1',
            slug: 's1',
            title: 'Read story',
            subtitle: null,
            excerpt: null,
            publishedAt: new Date('2026-01-01T00:00:00Z'),
            featuredImageUrl: null,
            featuredImageAlt: null,
            category: { name: 'World', slug: 'world' },
          },
        },
      ]);

      const res = await service.list('u1');
      expect(res[0].title).toBe('Read story');
      expect(res[0].viewedAt).toBe('2026-02-01T00:00:00.000Z');
      expect(res[0].featuredImage).toBeNull();
      const arg = (prisma.readingHistory.findMany.mock.calls[0] as [{ orderBy: unknown }])[0];
      expect(arg.orderBy).toEqual({ viewedAt: 'desc' });
    });
  });

  describe('clear', () => {
    it('deletes all history rows for the user', async () => {
      const { service, prisma } = build();
      prisma.readingHistory.deleteMany.mockResolvedValue({ count: 3 });
      expect(await service.clear('u1')).toEqual({ cleared: 3 });
    });
  });
});
