import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { stripText } from '../blocks';

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

export interface CorrectionItem {
  id: string;
  note: string;
  createdAt: string;
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

  // ── Sub-editor copy desk (status `copy_edit`) ────────────────────────────

  /** Articles on the copy desk awaiting a sub-editor, oldest first. */
  async listCopyDeskQueue(): Promise<ReviewItem[]> {
    const rows = await this.prisma.article.findMany({
      where: { status: ArticleStatus.copy_edit, deletedAt: null },
      include: reviewInclude,
      orderBy: { updatedAt: 'asc' },
    });
    return rows.map(toReviewItem);
  }

  /** Copy-editing done → pass to the editors' review queue (`ready`). */
  async passCopyEdit(id: string): Promise<ReviewItem> {
    await this.loadInStage(id, ArticleStatus.copy_edit);
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.ready, reviewNote: null },
      include: reviewInclude,
    });
    return toReviewItem(updated);
  }

  /** Send a copy-desk article back to its writer (`copy_edit` → `rejected`). */
  async returnCopyEdit(id: string, rawNote?: string): Promise<ReviewItem> {
    await this.loadInStage(id, ArticleStatus.copy_edit);
    const note = rawNote ? stripText(rawNote).slice(0, 1000) : '';
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.rejected, reviewNote: note || null },
      include: reviewInclude,
    });
    return toReviewItem(updated);
  }

  private async loadInStage(id: string, status: ArticleStatus): Promise<ReviewRow> {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: reviewInclude,
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.status !== status) {
      throw new ConflictException(`Article is not in "${status}" (it is "${article.status}")`);
    }
    return article;
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

  /**
   * Send a submitted article back to its author (`ready` → `rejected`) with an
   * optional note explaining what to fix. The note is stripped of markup.
   */
  async reject(id: string, rawNote?: string): Promise<ReviewItem> {
    await this.loadReviewable(id);
    const note = rawNote ? stripText(rawNote).slice(0, 1000) : '';
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.rejected, reviewNote: note || null },
      include: reviewInclude,
    });
    return toReviewItem(updated);
  }

  /**
   * Append a public, dated correction/retraction note to a **published** article
   * (`FR-EDIT-5`). Append-only: the log is never edited or deleted. The note is
   * stripped of markup on write (`05` §6).
   */
  async addCorrection(
    articleId: string,
    editorId: string,
    rawNote: string,
  ): Promise<CorrectionItem> {
    const note = stripText(rawNote);
    if (!note) {
      throw new BadRequestException('A correction note is required');
    }
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { status: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.status !== ArticleStatus.published) {
      throw new ConflictException('Corrections can only be added to published articles');
    }
    const correction = await this.prisma.articleCorrection.create({
      data: { articleId, editorId, note: note.slice(0, 1000) },
    });
    return {
      id: correction.id,
      note: correction.note,
      createdAt: correction.createdAt.toISOString(),
    };
  }

  /**
   * Pin/unpin a **published** article to the homepage (editor curation). Sets
   * `featuredAt` so the featured set orders newest-pin-first.
   */
  async setFeatured(id: string, featured: boolean): Promise<{ id: string; isFeatured: boolean }> {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      select: { status: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.status !== ArticleStatus.published) {
      throw new ConflictException('Only published articles can be featured on the homepage');
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data: { isFeatured: featured, featuredAt: featured ? new Date() : null },
      select: { id: true, isFeatured: true },
    });
    return updated;
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
