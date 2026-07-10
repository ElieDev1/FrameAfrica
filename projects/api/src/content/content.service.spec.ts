import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentService, buildCategoryTree } from './content.service';

type PrismaMock = {
  article: { findMany: jest.Mock; findFirst: jest.Mock };
  category: { findMany: jest.Mock; findFirst: jest.Mock };
  follow: { findMany: jest.Mock };
  readingHistory: { findMany: jest.Mock };
  user: { findUnique: jest.Mock };
  meterRead: { findUnique: jest.Mock; count: jest.Mock; create: jest.Mock };
};

type SettingsMock = { getValue: jest.Mock };

const articleRow = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  slug: 's1',
  title: 'Rwanda coffee exports climb',
  subtitle: null,
  excerpt: null,
  body: 'Full body text.',
  language: 'en',
  isPremium: false,
  isBreaking: false,
  readTimeMin: 3,
  viewCount: 10n,
  likeCount: 0,
  shareCount: 0,
  seo: {},
  publishedAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  category: { id: 'c1', name: 'Rwanda', slug: 'rwanda' },
  author: { id: 'u1', displayName: 'Jane Doe', avatarUrl: null },
  topics: [],
  corrections: [],
  isFeatured: false,
  isLive: false,
  ...over,
});

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaMock;
  let settings: SettingsMock;

  beforeEach(async () => {
    prisma = {
      article: { findMany: jest.fn(), findFirst: jest.fn() },
      category: { findMany: jest.fn(), findFirst: jest.fn() },
      follow: { findMany: jest.fn() },
      readingHistory: { findMany: jest.fn() },
      user: { findUnique: jest.fn() },
      meterRead: { findUnique: jest.fn(), count: jest.fn(), create: jest.fn() },
    };
    // Paywall meter is off unless PAYWALL_FREE_ARTICLES is set.
    settings = { getValue: jest.fn().mockResolvedValue(null) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminSettingsService, useValue: settings },
      ],
    }).compile();

    service = moduleRef.get(ContentService);
  });

  describe('listArticles', () => {
    it('maps rows to public summaries without leaking author PII', async () => {
      prisma.article.findMany.mockResolvedValue([articleRow()]);

      const res = await service.listArticles({});

      expect(res.hasMore).toBe(false);
      expect(res.nextCursor).toBeNull();
      expect(res.items).toHaveLength(1);
      expect(res.items[0]).toMatchObject({
        slug: 's1',
        publishedAt: '2026-01-01T00:00:00.000Z',
      });
      expect(res.items[0].author).toEqual({
        id: 'u1',
        displayName: 'Jane Doe',
        avatarUrl: null,
      });
    });

    it('maps a featured image with its alt + credit when present', async () => {
      prisma.article.findMany.mockResolvedValue([
        articleRow({
          featuredImageUrl: '/seed/coffee.jpg',
          featuredImageAlt: 'Coffee cherries',
          featuredImageCredit: 'Frame Africa',
        }),
      ]);

      const res = await service.listArticles({});

      expect(res.items[0].featuredImage).toEqual({
        url: '/seed/coffee.jpg',
        alt: 'Coffee cherries',
        credit: 'Frame Africa',
      });
    });

    it('returns a null featured image when the article has none', async () => {
      prisma.article.findMany.mockResolvedValue([articleRow()]);

      const res = await service.listArticles({});

      expect(res.items[0].featuredImage).toBeNull();
    });

    it('signals another page and returns a cursor when over the limit', async () => {
      prisma.article.findMany.mockResolvedValue([
        articleRow({ id: 'a1' }),
        articleRow({ id: 'a2' }),
      ]);

      const res = await service.listArticles({ limit: 1 });

      expect(res.hasMore).toBe(true);
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).toBe('a1');
      expect(prisma.article.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2 }));
    });

    it('restricts to published, non-deleted articles in the section and its sub-sections', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'c1', slug: 'business', parentId: null },
        { id: 'c2', slug: 'economy', parentId: 'c1' },
        { id: 'c3', slug: 'sports', parentId: null },
      ]);
      prisma.article.findMany.mockResolvedValue([]);

      await service.listArticles({ category: 'business' });

      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const call = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(call.where).toMatchObject({
        status: 'published',
        deletedAt: null,
        categoryId: { in: ['c1', 'c2'] }, // section + its descendant, not the sibling
      });
    });

    it('matches no articles for an unknown section slug', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'c1', slug: 'business', parentId: null }]);
      prisma.article.findMany.mockResolvedValue([]);

      await service.listArticles({ category: 'does-not-exist' });

      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const call = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(call.where).toMatchObject({ categoryId: { in: [] } });
    });

    it('orders by view count when sort=popular', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      await service.listArticles({ sort: 'popular' });

      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { orderBy: unknown };
      expect(arg.orderBy).toEqual([{ viewCount: 'desc' }, { id: 'desc' }]);
    });
  });

  describe('personalizedFeed', () => {
    it('filters to followed sections/topics + read categories and flags personalized', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { categoryId: 'c1', topicId: null },
        { categoryId: null, topicId: 't1' },
      ]);
      prisma.readingHistory.findMany.mockResolvedValue([{ article: { categoryId: 'c2' } }]);
      prisma.category.findMany.mockResolvedValue([
        { id: 'c1', parentId: null },
        { id: 'c2', parentId: null },
      ]);
      prisma.article.findMany.mockResolvedValue([articleRow()]);

      const res = await service.personalizedFeed('u1', {});

      expect(res.personalized).toBe(true);
      expect(res.items).toHaveLength(1);
      const call = (prisma.article.findMany.mock.calls as unknown[][])[0][0] as {
        where: { status: string; deletedAt: null; OR: unknown[] };
      };
      expect(call.where.status).toBe('published');
      expect(call.where.deletedAt).toBeNull();
      expect(call.where.OR).toEqual([
        { categoryId: { in: ['c1', 'c2'] } },
        { topics: { some: { topicId: { in: ['t1'] } } } },
      ]);
    });

    it('falls back to latest news (no OR filter, not personalized) with no signal', async () => {
      prisma.follow.findMany.mockResolvedValue([]);
      prisma.readingHistory.findMany.mockResolvedValue([]);
      prisma.article.findMany.mockResolvedValue([articleRow()]);

      const res = await service.personalizedFeed('u1', {});

      expect(res.personalized).toBe(false);
      const call = (prisma.article.findMany.mock.calls as unknown[][])[0][0] as {
        where: Record<string, unknown>;
      };
      expect(call.where).not.toHaveProperty('OR');
      expect(call.where).toMatchObject({ status: 'published', deletedAt: null });
    });
  });

  describe('getArticleBySlug', () => {
    it('returns the full body and unlocked for a free article', async () => {
      prisma.article.findFirst.mockResolvedValue(articleRow());

      const res = await service.getArticleBySlug('s1');

      expect(res.isLocked).toBe(false);
      expect(res.body).toBe('Full body text.');
      expect(res.viewCount).toBe(10);
    });

    it('locks premium articles behind a one-paragraph preview', async () => {
      prisma.article.findFirst.mockResolvedValue(
        articleRow({ isPremium: true, body: 'Teaser paragraph.\n\nRest of the story.' }),
      );

      const res = await service.getArticleBySlug('s1');

      expect(res.isLocked).toBe(true);
      expect(res.body).toBe('Teaser paragraph.');
    });

    it('throws NotFound when no published article matches', async () => {
      prisma.article.findFirst.mockResolvedValue(null);

      await expect(service.getArticleBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not meter when PAYWALL_FREE_ARTICLES is unset (default off)', async () => {
      prisma.article.findFirst.mockResolvedValue(articleRow());

      const res = await service.getArticleBySlug('s1', { readerKey: 'device-1' });

      expect(res.isLocked).toBe(false);
      expect(prisma.meterRead.count).not.toHaveBeenCalled();
    });

    it('locks a free article once the reader is over the monthly allowance', async () => {
      settings.getValue.mockResolvedValue('2');
      prisma.article.findFirst.mockResolvedValue(articleRow());
      prisma.meterRead.findUnique.mockResolvedValue(null); // not read before
      prisma.meterRead.count.mockResolvedValue(2); // already used the allowance

      const res = await service.getArticleBySlug('s1', { readerKey: 'device-1' });

      expect(res.isLocked).toBe(true);
      expect(prisma.meterRead.create).not.toHaveBeenCalled();
    });

    it('counts a read and serves the article while under the allowance', async () => {
      settings.getValue.mockResolvedValue('5');
      prisma.article.findFirst.mockResolvedValue(articleRow());
      prisma.meterRead.findUnique.mockResolvedValue(null);
      prisma.meterRead.count.mockResolvedValue(1);
      prisma.meterRead.create.mockResolvedValue({});

      const res = await service.getArticleBySlug('s1', { readerKey: 'device-1' });

      expect(res.isLocked).toBe(false);
      expect(prisma.meterRead.create).toHaveBeenCalledTimes(1);
    });

    it('never charges twice for re-reading the same story', async () => {
      settings.getValue.mockResolvedValue('1');
      prisma.article.findFirst.mockResolvedValue(articleRow());
      prisma.meterRead.findUnique.mockResolvedValue({ articleId: 'a1' }); // already counted

      const res = await service.getArticleBySlug('s1', { readerKey: 'device-1' });

      expect(res.isLocked).toBe(false);
      expect(prisma.meterRead.count).not.toHaveBeenCalled();
    });

    it('a subscriber bypasses the meter and premium locks', async () => {
      settings.getValue.mockResolvedValue('1');
      prisma.article.findFirst.mockResolvedValue(articleRow({ isPremium: true }));
      const future = new Date(Date.now() + 86_400_000);
      prisma.user.findUnique.mockResolvedValue({ subscribedUntil: future });

      const res = await service.getArticleBySlug('s1', { readerKey: 'd1', userId: 'u1' });

      expect(res.isLocked).toBe(false);
      expect(prisma.meterRead.count).not.toHaveBeenCalled();
    });
  });

  describe('getCategoryTree', () => {
    it('nests children beneath their parent', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'p',
          parentId: null,
          name: 'News',
          slug: 'news',
          description: null,
        },
        {
          id: 'c',
          parentId: 'p',
          name: 'Rwanda',
          slug: 'rwanda',
          description: null,
        },
      ]);

      const tree = await service.getCategoryTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].children[0].slug).toBe('rwanda');
    });
  });

  describe('getCategoryBySlug', () => {
    it('returns an active category with its parent and sub-sections', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'c1',
        name: 'Business',
        slug: 'business',
        description: null,
        parent: null,
        children: [{ id: 'c2', name: 'Economy', slug: 'economy' }],
      });

      const category = await service.getCategoryBySlug('business');

      expect(category).toMatchObject({
        slug: 'business',
        name: 'Business',
        parent: null,
        children: [{ slug: 'economy' }],
      });
      const calls = prisma.category.findFirst.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(arg.where).toMatchObject({ slug: 'business', isActive: true });
    });

    it('throws NotFound for an unknown or inactive category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.getCategoryBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getRelated', () => {
    it('returns other published articles in the same category', async () => {
      prisma.article.findFirst.mockResolvedValue({ id: 'a1', categoryId: 'c1' });
      prisma.article.findMany.mockResolvedValue([articleRow({ id: 'a2', slug: 's2' })]);

      const res = await service.getRelated('s1');

      expect(res).toHaveLength(1);
      expect(res[0].slug).toBe('s2');
      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as { where: Record<string, unknown>; take: number };
      expect(arg.where).toMatchObject({
        status: 'published',
        categoryId: 'c1',
        id: { not: 'a1' },
      });
      expect(arg.take).toBe(4);
    });

    it('returns empty for an unknown slug', async () => {
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.getRelated('nope')).resolves.toEqual([]);
    });
  });
});

describe('buildCategoryTree', () => {
  it('treats a node with an unknown parent as a root', () => {
    const tree = buildCategoryTree([
      { id: 'x', parentId: 'missing', name: 'X', slug: 'x', description: null },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('x');
  });
});
