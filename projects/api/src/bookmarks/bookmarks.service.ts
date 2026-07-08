import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BookmarkStatus, SavedArticle } from './bookmarks.types';

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

type SavedRow = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

/**
 * Reader "saved articles" (bookmarks). One per user per article; the reader's
 * account surfaces the list. Saving is idempotent.
 */
@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, articleId: string): Promise<BookmarkStatus> {
    await this.assertPublished(articleId);
    await this.prisma.bookmark.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: {},
      create: { userId, articleId },
    });
    return { saved: true };
  }

  async unsave(userId: string, articleId: string): Promise<BookmarkStatus> {
    await this.prisma.bookmark.deleteMany({ where: { userId, articleId } });
    return { saved: false };
  }

  async status(userId: string, articleId: string): Promise<BookmarkStatus> {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { userId: true },
    });
    return { saved: Boolean(existing) };
  }

  /** The reader's saved (still-published) articles, most recently saved first. */
  async listSaved(userId: string): Promise<SavedArticle[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, article: { status: ArticleStatus.published, deletedAt: null } },
      include: { article: { select: articleSelect } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => toSaved(row.article));
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

function toSaved(article: SavedRow): SavedArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    category: article.category,
    featuredImage: article.featuredImageUrl
      ? { url: article.featuredImageUrl, alt: article.featuredImageAlt }
      : null,
  };
}
