import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { HistoryArticle, RecordStatus } from './history.types';

const articleSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  publishedAt: true,
  featuredImageUrl: true,
  featuredImageAlt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ArticleSelect;

type HistoryRow = Prisma.ReadingHistoryGetPayload<{
  include: { article: { select: typeof articleSelect } };
}>;

/**
 * Reader reading history: one row per user per article, `viewedAt` bumped on
 * each read. Recorded only for signed-in readers; surfaced as "Recently read"
 * in the account and used as a signal for the personalised feed. The reader can
 * clear it at any time (privacy).
 */
@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, articleId: string): Promise<RecordStatus> {
    await this.assertPublished(articleId);
    await this.prisma.readingHistory.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: { viewedAt: new Date() },
      create: { userId, articleId },
    });
    return { recorded: true };
  }

  /** The reader's recently read (still-published) articles, newest first. */
  async list(userId: string, limit = 50): Promise<HistoryArticle[]> {
    const rows = await this.prisma.readingHistory.findMany({
      where: { userId, article: { status: ArticleStatus.published, deletedAt: null } },
      include: { article: { select: articleSelect } },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });
    return rows.map(toHistoryArticle);
  }

  async clear(userId: string): Promise<{ cleared: number }> {
    const { count } = await this.prisma.readingHistory.deleteMany({ where: { userId } });
    return { cleared: count };
  }

  private async assertPublished(articleId: string): Promise<void> {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.published, deletedAt: null },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
  }
}

function toHistoryArticle(row: HistoryRow): HistoryArticle {
  const { article } = row;
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    viewedAt: row.viewedAt.toISOString(),
    category: article.category,
    featuredImage: article.featuredImageUrl
      ? { url: article.featuredImageUrl, alt: article.featuredImageAlt }
      : null,
  };
}
