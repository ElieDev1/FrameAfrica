import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { CmsEditorService } from './cms-editor.service';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  slug: 's1',
  title: 'A submitted story',
  status: 'ready',
  publishedAt: null,
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  category: { id: 'c1', name: 'Rwanda', slug: 'rwanda' },
  author: { id: 'u1', displayName: 'Jane Uwase' },
  ...over,
});

function build() {
  const prisma = {
    article: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };
  return { service: new CmsEditorService(prisma as unknown as PrismaService), prisma };
}

describe('CmsEditorService', () => {
  describe('listReviewQueue', () => {
    it('returns only ready articles, with their author', async () => {
      const { service, prisma } = build();
      prisma.article.findMany.mockResolvedValue([row()]);

      const res = await service.listReviewQueue();

      expect(res[0].author.displayName).toBe('Jane Uwase');
      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(arg.where).toMatchObject({ status: 'ready', deletedAt: null });
    });
  });

  describe('publish', () => {
    it('publishes a ready article and stamps publishedAt', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready', publishedAt: null }));
      prisma.article.update.mockResolvedValue(row({ status: 'published' }));

      const res = await service.publish('a1');

      expect(res.status).toBe('published');
      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: Record<string, unknown> };
      expect(arg.data.status).toBe('published');
      expect(arg.data.publishedAt).toBeInstanceOf(Date);
    });

    it('refuses to publish an article that is not in review', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'draft' }));
      await expect(service.publish('a1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('404s an unknown article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.publish('a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reject', () => {
    it('sends a ready article back to rejected', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready' }));
      prisma.article.update.mockResolvedValue(row({ status: 'rejected' }));

      const res = await service.reject('a1');

      expect(res.status).toBe('rejected');
    });
  });
});
