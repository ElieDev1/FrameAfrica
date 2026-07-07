import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { CmsDraftService } from './cms-draft.service';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  slug: 'my-draft',
  title: 'My Draft',
  subtitle: null,
  excerpt: null,
  body: 'Hello world',
  status: 'draft',
  language: 'en',
  isPremium: false,
  readTimeMin: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  category: { id: 'c1', name: 'Rwanda', slug: 'rwanda' },
  ...over,
});

function build() {
  const prisma = {
    article: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    category: { findUnique: jest.fn() },
  };
  const service = new CmsDraftService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('CmsDraftService', () => {
  describe('createDraft', () => {
    it('creates a draft with a slug and an initial revision', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.article.findUnique.mockResolvedValue(null); // slug free
      prisma.article.create.mockResolvedValue(row());

      const res = await service.createDraft('u1', {
        title: 'My Draft',
        categoryId: 'c1',
        body: 'Hello world',
      });

      expect(res.status).toBe('draft');
      const calls = prisma.article.create.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: Record<string, unknown> };
      expect(arg.data.slug).toBe('my-draft');
      expect(arg.data.status).toBe('draft');
      expect(arg.data).toHaveProperty('revisions');
    });

    it('stores the featured image with its alt + credit', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.create.mockResolvedValue(row());

      await service.createDraft('u1', {
        title: 'My Draft',
        categoryId: 'c1',
        body: 'x',
        featuredImageUrl: '/seed/x.jpg',
        featuredImageAlt: 'An alt',
        featuredImageCredit: 'Frame Africa',
      });

      const calls = prisma.article.create.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: Record<string, unknown> };
      expect(arg.data.featuredImageUrl).toBe('/seed/x.jpg');
      expect(arg.data.featuredImageAlt).toBe('An alt');
      expect(arg.data.featuredImageCredit).toBe('Frame Africa');
    });

    it('rejects an unknown category', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.createDraft('u1', { title: 'X title', categoryId: 'bad' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getMyDraft', () => {
    it('scopes lookups to the author and 404s when missing', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.getMyDraft('u1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
      const calls = prisma.article.findFirst.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(arg.where).toMatchObject({ id: 'a1', authorId: 'u1', deletedAt: null });
    });
  });

  describe('updateDraft', () => {
    it('re-slugs on title change and records a revision', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ title: 'Old', body: 'old' }));
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.update.mockResolvedValue(row({ title: 'New Title', slug: 'new-title' }));

      await service.updateDraft('u1', 'a1', { title: 'New Title', changeNote: 'tweak' });

      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: Record<string, unknown> };
      expect(arg.data.slug).toBe('new-title');
      expect(arg.data).toHaveProperty('revisions');
    });

    it('updates the featured image and clears an emptied value to null', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row());
      prisma.article.update.mockResolvedValue(row());

      await service.updateDraft('u1', 'a1', { featuredImageUrl: '', featuredImageAlt: 'New alt' });

      const calls = prisma.article.update.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { data: Record<string, unknown> };
      expect(arg.data.featuredImageUrl).toBeNull();
      expect(arg.data.featuredImageAlt).toBe('New alt');
    });

    it('refuses to edit a non-editable (e.g. published) article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'published' }));
      await expect(service.updateDraft('u1', 'a1', { title: 'Nope title' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('submitDraft', () => {
    it('moves an editable draft to ready', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(row({ status: 'draft' }));
      prisma.article.update.mockResolvedValue(row({ status: 'ready' }));

      const res = await service.submitDraft('u1', 'a1');

      expect(res.status).toBe('ready');
      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ready' } }),
      );
    });
  });
});
