import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { BookmarksService } from './bookmarks.service';

function build() {
  const prisma = {
    bookmark: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    article: { findFirst: jest.fn() },
  };
  return { service: new BookmarksService(prisma as unknown as PrismaService), prisma };
}

describe('BookmarksService', () => {
  describe('save', () => {
    it('saves a published article (idempotent upsert)', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.bookmark.upsert.mockResolvedValue({});

      expect(await service.save('u1', 'a1')).toEqual({ saved: true });
      expect(prisma.bookmark.upsert).toHaveBeenCalledTimes(1);
    });

    it('404s an unpublished/unknown article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.save('u1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unsave', () => {
    it('removes the bookmark', async () => {
      const { service, prisma } = build();
      prisma.bookmark.deleteMany.mockResolvedValue({ count: 1 });
      expect(await service.unsave('u1', 'a1')).toEqual({ saved: false });
    });
  });

  describe('status', () => {
    it('reports saved', async () => {
      const { service, prisma } = build();
      prisma.bookmark.findUnique.mockResolvedValue({ userId: 'u1' });
      expect(await service.status('u1', 'a1')).toEqual({ saved: true });
    });
  });

  describe('listSaved', () => {
    it('maps saved articles newest-first', async () => {
      const { service, prisma } = build();
      prisma.bookmark.findMany.mockResolvedValue([
        {
          article: {
            id: 'a1',
            slug: 's1',
            title: 'Saved story',
            subtitle: null,
            excerpt: null,
            publishedAt: new Date('2026-01-01T00:00:00Z'),
            featuredImageUrl: '/seed/x.jpg',
            featuredImageAlt: 'x',
            category: { name: 'Business', slug: 'business' },
          },
        },
      ]);

      const res = await service.listSaved('u1');
      expect(res[0].title).toBe('Saved story');
      expect(res[0].featuredImage).toEqual({ url: '/seed/x.jpg', alt: 'x' });
      const arg = prisma.bookmark.findMany.mock.calls[0][0] as { orderBy: unknown };
      expect(arg.orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
