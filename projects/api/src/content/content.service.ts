import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { blocksFromPlainBody, previewBlocks, type Block } from './blocks';
import type {
  ArticleDetail,
  ArticleSummary,
  CategoryDetail,
  CategoryNode,
  TopicDetail,
} from './content.types';

const DEFAULT_LIMIT = 20;

/**
 * Relations pulled with every public article. Author is narrowed with `select`
 * so sensitive columns (password hash, 2FA secret, email, phone) are never
 * loaded, let alone serialized.
 */
const articleInclude = {
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, displayName: true, avatarUrl: true } },
  topics: {
    include: { topic: { select: { id: true, name: true, slug: true } } },
    orderBy: { topic: { name: 'asc' } },
  },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Published articles only, newest first, cursor-paginated. */
  async listArticles(query: ListArticlesQueryDto): Promise<{
    items: ArticleSummary[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const limit = query.limit ?? DEFAULT_LIMIT;

    // A section aggregates its sub-sections: filtering by a section slug matches
    // articles in that category *and* all of its descendants. Unknown slug → no
    // matches (empty id list).
    const categoryIds = query.category ? await this.categorySubtreeIds(query.category) : null;

    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.published,
      deletedAt: null,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.topic ? { topics: { some: { topic: { slug: query.topic } } } } : {}),
      ...(query.language ? { language: query.language } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { subtitle: { contains: query.q, mode: 'insensitive' } },
              { excerpt: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
      query.sort === 'popular'
        ? [{ viewCount: 'desc' }, { id: 'desc' }]
        : [{ publishedAt: 'desc' }, { id: 'desc' }];

    const rows = await this.prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { items: page.map(toArticleSummary), nextCursor, hasMore };
  }

  /** A single published article by slug, or 404. */
  async getArticleBySlug(slug: string): Promise<ArticleDetail> {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.published, deletedAt: null },
      include: articleInclude,
    });

    if (!article) {
      throw new NotFoundException(`Article "${slug}" was not found`);
    }

    return toArticleDetail(article);
  }

  /** Active categories as a nested tree (parents → children). */
  async getCategoryTree(): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return buildCategoryTree(categories);
  }

  /** A single active category by slug (section masthead) with its parent + active
   * sub-sections (for breadcrumb + sub-section chips), or 404. */
  async getCategoryBySlug(slug: string): Promise<CategoryDetail> {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parent: { select: { name: true, slug: true } },
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category "${slug}" was not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
      children: category.children,
    };
  }

  /** All active topics, alphabetical — for tag pickers and topic indexes. */
  async listTopics(): Promise<TopicDetail[]> {
    return this.prisma.topic.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  /** A single active topic by slug (topic page masthead), or 404. */
  async getTopicBySlug(slug: string): Promise<TopicDetail> {
    const topic = await this.prisma.topic.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true, description: true },
    });
    if (!topic) {
      throw new NotFoundException(`Topic "${slug}" was not found`);
    }
    return topic;
  }

  /**
   * The category matching `slug` plus every descendant, as an id list. Returns
   * `[]` for an unknown/inactive slug so callers match no articles. Loads the
   * (small) active-category set once and walks it in memory.
   */
  private async categorySubtreeIds(slug: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, parentId: true },
    });
    const root = all.find((c) => c.slug === slug);
    if (!root) return [];

    const childrenByParent = new Map<string, string[]>();
    for (const c of all) {
      if (c.parentId) {
        const siblings = childrenByParent.get(c.parentId) ?? [];
        siblings.push(c.id);
        childrenByParent.set(c.parentId, siblings);
      }
    }

    const ids: string[] = [];
    const stack = [root.id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      ids.push(current);
      stack.push(...(childrenByParent.get(current) ?? []));
    }
    return ids;
  }

  /** Up to 4 other published articles in the same category (empty if none / unknown slug). */
  async getRelated(slug: string): Promise<ArticleSummary[]> {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.published, deletedAt: null },
      select: { id: true, categoryId: true },
    });
    if (!article) {
      return [];
    }

    const rows = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.published,
        deletedAt: null,
        categoryId: article.categoryId,
        id: { not: article.id },
      },
      include: articleInclude,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 4,
    });

    return rows.map(toArticleSummary);
  }
}

function toArticleSummary(article: ArticleWithRelations): ArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    language: article.language,
    isPremium: article.isPremium,
    isBreaking: article.isBreaking,
    readTimeMin: article.readTimeMin,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    featuredImage: article.featuredImageUrl
      ? {
          url: article.featuredImageUrl,
          alt: article.featuredImageAlt,
          credit: article.featuredImageCredit,
        }
      : null,
    category: article.category,
    author: article.author,
    topics: article.topics.map((t) => t.topic),
  };
}

function toArticleDetail(article: ArticleWithRelations): ArticleDetail {
  // No auth/subscription context exists in this public-read slice yet, so every
  // caller is treated as unsubscribed — premium bodies stay behind a preview
  // until billing (documents/04-API-Design.md §7) lands.
  const isLocked = article.isPremium;

  // Prefer the structured block document; older articles are converted from
  // their plain body so the renderer always receives blocks. Premium stories
  // expose only a preview until billing lands.
  const stored = Array.isArray(article.blocks) ? (article.blocks as unknown as Block[]) : null;
  const fullBlocks = stored ?? blocksFromPlainBody(article.body);
  const blocks = isLocked ? previewBlocks(fullBlocks) : fullBlocks;

  return {
    ...toArticleSummary(article),
    body: isLocked ? previewParagraph(article.body) : article.body,
    blocks,
    seo: article.seo,
    viewCount: Number(article.viewCount),
    likeCount: article.likeCount,
    shareCount: article.shareCount,
    updatedAt: article.updatedAt.toISOString(),
    isLocked,
  };
}

/** The free teaser shown before the paywall prompt: the article's first paragraph. */
function previewParagraph(body: string): string {
  return body.split('\n\n')[0] ?? '';
}

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
};

/** Assemble a flat category list into a parent→children tree in one pass. */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    // Guaranteed present: every row.id was inserted into `nodes` in the loop above.
    const node = nodes.get(row.id)!;
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
