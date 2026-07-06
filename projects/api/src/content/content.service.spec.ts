import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ContentService, buildCategoryTree } from './content.service';

type PrismaMock = {
  article: { findMany: jest.Mock; findFirst: jest.Mock };
  category: { findMany: jest.Mock };
};

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
  ...over,
});

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      article: { findMany: jest.fn(), findFirst: jest.fn() },
      category: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ContentService, { provide: PrismaService, useValue: prisma }],
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

    it('restricts the query to published, non-deleted articles', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      await service.listArticles({ category: 'rwanda' });

      const calls = prisma.article.findMany.mock.calls as unknown[][];
      const call = calls[0]?.[0] as { where: Record<string, unknown> };
      expect(call.where).toMatchObject({
        status: 'published',
        deletedAt: null,
        category: { slug: 'rwanda' },
      });
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
