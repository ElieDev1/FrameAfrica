import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
    article: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    articleCorrection: { create: jest.fn() },
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

  describe('schedule', () => {
    it('embargoes a ready article for a future time', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready' }));
      prisma.article.update.mockResolvedValue(row({ status: 'embargoed' }));
      const when = new Date(Date.now() + 3_600_000);

      await service.schedule('a1', when);

      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: { status: string; embargoUntil: Date } };
      expect(arg.data.status).toBe('embargoed');
      expect(arg.data.embargoUntil).toEqual(when);
    });

    it('rejects a past schedule time', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready' }));
      await expect(service.schedule('a1', new Date(Date.now() - 1000))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('archive', () => {
    it('archives a published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'published' }));
      prisma.article.update.mockResolvedValue(row({ status: 'archived' }));
      const res = await service.archive('a1');
      expect(res.status).toBe('archived');
    });

    it('refuses to archive a non-published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready' }));
      await expect(service.archive('a1')).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('publishDue', () => {
    it('promotes embargoed articles whose time has arrived', async () => {
      const { service, prisma } = build();
      prisma.article.updateMany.mockResolvedValue({ count: 2 });
      const n = await service.publishDue(new Date('2026-07-09T12:00:00Z'));
      expect(n).toBe(2);
      const calls = prisma.article.updateMany.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown>; data: { status: string } };
      expect(arg.where).toMatchObject({ status: 'embargoed' });
      expect(arg.data.status).toBe('published');
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

    it('stores a stripped return-note when one is given', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'ready' }));
      prisma.article.update.mockResolvedValue(row({ status: 'rejected' }));

      await service.reject('a1', 'Please add a <b>source</b> for the figure.');

      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: { reviewNote: string | null } };
      expect(arg.data.reviewNote).toBe('Please add a source for the figure.');
    });
  });

  describe('setFeatured', () => {
    it('pins a published article and stamps featuredAt', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'published' });
      prisma.article.update.mockResolvedValue({ id: 'a1', isFeatured: true });

      const res = await service.setFeatured('a1', true);

      expect(res.isFeatured).toBe(true);
      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: { isFeatured: boolean; featuredAt: Date | null } };
      expect(arg.data.isFeatured).toBe(true);
      expect(arg.data.featuredAt).toBeInstanceOf(Date);
    });

    it('unpins and clears featuredAt', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'published' });
      prisma.article.update.mockResolvedValue({ id: 'a1', isFeatured: false });

      await service.setFeatured('a1', false);

      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: { featuredAt: Date | null } };
      expect(arg.data.featuredAt).toBeNull();
    });

    it('refuses to feature a non-published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'draft' });
      await expect(service.setFeatured('a1', true)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addCorrection', () => {
    it('appends a stripped note to a published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'published' });
      prisma.articleCorrection.create.mockResolvedValue({
        id: 'k1',
        note: 'Fixed the date.',
        createdAt: new Date('2026-01-03T00:00:00Z'),
      });

      const res = await service.addCorrection('a1', 'ed1', 'Fixed the <b>date</b>.');

      expect(res.note).toBe('Fixed the date.');
      const calls = prisma.articleCorrection.create.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: { note: string; editorId: string } };
      expect(arg.data.note).toBe('Fixed the date.'); // markup stripped
      expect(arg.data.editorId).toBe('ed1');
    });

    it('rejects an empty note', async () => {
      const { service } = build();
      await expect(service.addCorrection('a1', 'ed1', '   ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses to correct a non-published article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ status: 'draft' });
      await expect(service.addCorrection('a1', 'ed1', 'A note')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
