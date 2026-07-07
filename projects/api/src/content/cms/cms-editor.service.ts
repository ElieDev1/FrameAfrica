import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const reviewInclude = {
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, displayName: true } },
} satisfies Prisma.ArticleInclude;

type ReviewRow = Prisma.ArticleGetPayload<{ include: typeof reviewInclude }>;

export interface ReviewItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  author: { id: string; displayName: string };
}

/**
 * Editor side of the workflow: see submitted articles and publish or reject
 * them. Not author-scoped — editors act on any article (`FR-EDIT-1`, `02` §6).
 */
@Injectable()
export class CmsEditorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Articles submitted for review (status `ready`), oldest first. */
  async listReviewQueue(): Promise<ReviewItem[]> {
    const rows = await this.prisma.article.findMany({
      where: { status: ArticleStatus.ready, deletedAt: null },
      include: reviewInclude,
      orderBy: { updatedAt: 'asc' },
    });
    return rows.map(toReviewItem);
  }

  /** Publish a submitted article (`ready` → `published`). */
  async publish(id: string): Promise<ReviewItem> {
    const article = await this.loadReviewable(id);
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.published,
        publishedAt: article.publishedAt ?? new Date(),
      },
      include: reviewInclude,
    });
    return toReviewItem(updated);
  }

  /** Send a submitted article back to its author (`ready` → `rejected`). */
  async reject(id: string): Promise<ReviewItem> {
    await this.loadReviewable(id);
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.rejected },
      include: reviewInclude,
    });
    return toReviewItem(updated);
  }

  private async loadReviewable(id: string): Promise<ReviewRow> {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: reviewInclude,
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.status !== ArticleStatus.ready) {
      throw new ConflictException(
        `Only articles in review ("ready") can be actioned (this one is "${article.status}")`,
      );
    }
    return article;
  }
}

function toReviewItem(article: ReviewRow): ReviewItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    status: article.status,
    updatedAt: article.updatedAt.toISOString(),
    category: article.category,
    author: article.author,
  };
}
