import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { slugify } from '../../common/slug';
import { PrismaService } from '../../prisma/prisma.service';
import { plainTextFromBlocks, readTimeFromBlocks, sanitizeBlocks, type Block } from '../blocks';
import type { DraftDetail, DraftListItem } from './cms.types';
import type { CreateDraftDto } from './dto/create-draft.dto';
import type { UpdateDraftDto } from './dto/update-draft.dto';

// Statuses a journalist may still edit / submit.
const EDITABLE: ArticleStatus[] = [
  ArticleStatus.draft,
  ArticleStatus.in_progress,
  ArticleStatus.rejected,
];

const draftInclude = {
  category: { select: { id: true, name: true, slug: true } },
  topics: { include: { topic: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.ArticleInclude;

type DraftRow = Prisma.ArticleGetPayload<{ include: typeof draftInclude }>;

/**
 * Journalist-facing draft lifecycle. Every method is scoped to the calling
 * author (object-level authZ — prevents IDOR, `05` §4). Each save snapshots an
 * ArticleRevision.
 */
@Injectable()
export class CmsDraftService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(authorId: string, dto: CreateDraftDto): Promise<DraftDetail> {
    await this.assertCategoryExists(dto.categoryId);

    // A block document (when supplied) is the source of truth; the plain-text
    // `body` is derived from it for excerpt/search/read-time. Otherwise fall
    // back to the legacy plain `body`.
    const content = resolveContent(dto.blocks, dto.body);
    const topicIds = await this.resolveTopicIds(dto.topics);

    const article = await this.prisma.article.create({
      data: {
        slug: await this.uniqueSlug(slugify(dto.title)),
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        excerpt: dto.excerpt ?? null,
        body: content.body,
        blocks: content.blocks ?? Prisma.DbNull,
        ...(topicIds.length
          ? { topics: { create: topicIds.map((id) => ({ topic: { connect: { id } } })) } }
          : {}),
        language: dto.language ?? 'en',
        isPremium: dto.isPremium ?? false,
        featuredImageUrl: dto.featuredImageUrl || null,
        featuredImageAlt: dto.featuredImageAlt || null,
        featuredImageCredit: dto.featuredImageCredit || null,
        status: ArticleStatus.draft,
        readTimeMin: content.readTimeMin,
        author: { connect: { id: authorId } },
        category: { connect: { id: dto.categoryId } },
        revisions: {
          create: [
            {
              editor: { connect: { id: authorId } },
              title: dto.title,
              body: content.body,
              changeNote: 'Created',
            },
          ],
        },
      },
      include: draftInclude,
    });

    return toDraftDetail(article);
  }

  async listMyDrafts(authorId: string): Promise<DraftListItem[]> {
    const rows = await this.prisma.article.findMany({
      where: { authorId, deletedAt: null },
      include: draftInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(toDraftListItem);
  }

  async getMyDraft(authorId: string, id: string): Promise<DraftDetail> {
    const article = await this.prisma.article.findFirst({
      where: { id, authorId, deletedAt: null },
      include: draftInclude,
    });
    if (!article) {
      throw new NotFoundException('Draft not found');
    }
    return toDraftDetail(article);
  }

  async updateDraft(authorId: string, id: string, dto: UpdateDraftDto): Promise<DraftDetail> {
    const existing = await this.ownEditable(authorId, id);
    const data = await this.buildUpdateData(existing, dto, authorId);
    const updated = await this.prisma.article.update({
      where: { id },
      data,
      include: draftInclude,
    });
    return toDraftDetail(updated);
  }

  /**
   * Build the update payload shared by author and admin edits, including a
   * revision snapshot attributed to `editorId`.
   */
  private async buildUpdateData(
    existing: DraftRow,
    dto: UpdateDraftDto,
    editorId: string,
  ): Promise<Prisma.ArticleUpdateInput> {
    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      if (dto.title !== existing.title) {
        data.slug = await this.uniqueSlug(slugify(dto.title));
      }
    }
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.isPremium !== undefined) data.isPremium = dto.isPremium;
    if (dto.featuredImageUrl !== undefined) data.featuredImageUrl = dto.featuredImageUrl || null;
    if (dto.featuredImageAlt !== undefined) data.featuredImageAlt = dto.featuredImageAlt || null;
    if (dto.featuredImageCredit !== undefined)
      data.featuredImageCredit = dto.featuredImageCredit || null;
    // Blocks win when present (structured document); a derived plain body keeps
    // excerpt/search/read-time in sync. A legacy plain `body` is still accepted.
    if (dto.blocks !== undefined) {
      const content = resolveContent(dto.blocks, undefined);
      data.blocks = content.blocks ?? Prisma.DbNull;
      data.body = content.body;
      data.readTimeMin = content.readTimeMin;
    } else if (dto.body !== undefined) {
      data.body = dto.body;
      data.readTimeMin = readTime(dto.body);
    }
    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.topics !== undefined) {
      const topicIds = await this.resolveTopicIds(dto.topics);
      // Replace the whole tag set with the submitted one.
      data.topics = {
        deleteMany: {},
        create: topicIds.map((id) => ({ topic: { connect: { id } } })),
      };
    }

    data.revisions = {
      create: [
        {
          editor: { connect: { id: editorId } },
          title: dto.title ?? existing.title,
          // Snapshot the resolved body (derived from blocks when supplied).
          body: (data.body as string | undefined) ?? existing.body,
          changeNote: dto.changeNote ?? null,
        },
      ],
    };
    return data;
  }

  // ── Admin: edit any article, regardless of author or status ──────────────

  /** All articles (any author, any status), newest first, optionally filtered. */
  async listAll(filter: { status?: ArticleStatus; q?: string } = {}): Promise<DraftListItem[]> {
    const where: Prisma.ArticleWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { slug: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.article.findMany({
      where,
      include: draftInclude,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map(toDraftListItem);
  }

  /** Load any article for admin editing. */
  async getAny(id: string): Promise<DraftDetail> {
    return toDraftDetail(await this.loadAny(id));
  }

  /** Admin update: no ownership scope and no editable-status restriction. */
  async updateAny(editorId: string, id: string, dto: UpdateDraftDto): Promise<DraftDetail> {
    const existing = await this.loadAny(id);
    const data = await this.buildUpdateData(existing, dto, editorId);
    const updated = await this.prisma.article.update({
      where: { id },
      data,
      include: draftInclude,
    });
    return toDraftDetail(updated);
  }

  private async loadAny(id: string): Promise<DraftRow> {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: draftInclude,
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  /** Admin create — optionally publishing immediately (bypasses review). */
  async createAsAdmin(
    authorId: string,
    dto: CreateDraftDto,
    publish = false,
  ): Promise<DraftDetail> {
    const draft = await this.createDraft(authorId, dto);
    return publish ? this.setStatusAny(draft.id, 'publish') : draft;
  }

  /** Admin direct status control: publish / unpublish / archive any article. */
  async setStatusAny(
    id: string,
    action: 'publish' | 'unpublish' | 'archive',
  ): Promise<DraftDetail> {
    const existing = await this.loadAny(id);
    let data: Prisma.ArticleUpdateInput;
    if (action === 'publish') {
      data = { status: ArticleStatus.published, publishedAt: existing.publishedAt ?? new Date() };
    } else if (action === 'unpublish') {
      data = { status: ArticleStatus.draft };
    } else {
      data = { status: ArticleStatus.archived };
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data,
      include: draftInclude,
    });
    return toDraftDetail(updated);
  }

  /** Admin soft-delete (recoverable). */
  async deleteAny(id: string): Promise<{ id: string; deleted: true }> {
    await this.loadAny(id);
    await this.prisma.article.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id, deleted: true };
  }

  /** Admin restore of a soft-deleted article. */
  async restoreAny(id: string): Promise<DraftDetail> {
    const article = await this.prisma.article.findUnique({ where: { id }, include: draftInclude });
    if (!article) throw new NotFoundException('Article not found');
    const restored = await this.prisma.article.update({
      where: { id },
      data: { deletedAt: null },
      include: draftInclude,
    });
    return toDraftDetail(restored);
  }

  /** Admin: soft-deleted articles (the trash), newest first. */
  async listDeleted(): Promise<DraftListItem[]> {
    const rows = await this.prisma.article.findMany({
      where: { deletedAt: { not: null } },
      include: draftInclude,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map(toDraftListItem);
  }

  /** Submit a draft for editorial review (→ `ready`). */
  async submitDraft(authorId: string, id: string): Promise<DraftDetail> {
    await this.ownEditable(authorId, id);
    const updated = await this.prisma.article.update({
      where: { id },
      // Resubmitting clears any prior editor return-note.
      data: { status: ArticleStatus.ready, reviewNote: null },
      include: draftInclude,
    });
    return toDraftDetail(updated);
  }

  /** Load an article owned by the author that is still in an editable state. */
  private async ownEditable(authorId: string, id: string): Promise<DraftRow> {
    const article = await this.prisma.article.findFirst({
      where: { id, authorId, deletedAt: null },
      include: draftInclude,
    });
    if (!article) {
      throw new NotFoundException('Draft not found');
    }
    if (!EDITABLE.includes(article.status)) {
      throw new ConflictException(`Cannot edit an article in "${article.status}" state`);
    }
    return article;
  }

  /** Map submitted topic slugs to ids, silently dropping any that don't exist. */
  private async resolveTopicIds(slugs: string[] | undefined): Promise<string[]> {
    if (!slugs || slugs.length === 0) return [];
    const unique = [...new Set(slugs)];
    const topics = await this.prisma.topic.findMany({
      where: { slug: { in: unique }, isActive: true },
      select: { id: true },
    });
    return topics.map((t) => t.id);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Unknown category');
    }
  }

  private async uniqueSlug(base: string): Promise<string> {
    for (let n = 1; n <= 50; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const clash = await this.prisma.article.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    return `${base}-${Date.now()}`;
  }
}

function readTime(body: string): number {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Resolve the pair we persist for an article body. When a block document is
 * supplied it is sanitised and becomes the source of truth, with the plain
 * `body` (excerpt/search/read-time) derived from it. Otherwise the legacy plain
 * `body` is used and no blocks are stored.
 */
function resolveContent(
  rawBlocks: unknown[] | undefined,
  rawBody: string | undefined,
): { blocks: Prisma.InputJsonValue | null; body: string; readTimeMin: number } {
  if (rawBlocks !== undefined) {
    const blocks = sanitizeBlocks(rawBlocks);
    const body = plainTextFromBlocks(blocks);
    return {
      blocks: blocks as unknown as Prisma.InputJsonValue,
      body,
      readTimeMin: readTimeFromBlocks(blocks),
    };
  }
  const body = rawBody ?? '';
  return { blocks: null, body, readTimeMin: readTime(body) };
}

/** Read the stored (already-sanitised) block document off an article row. */
function readBlocks(value: Prisma.JsonValue | null): Block[] | null {
  return Array.isArray(value) ? (value as unknown as Block[]) : null;
}

function toDraftListItem(article: DraftRow): DraftListItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    status: article.status,
    language: article.language,
    isPremium: article.isPremium,
    updatedAt: article.updatedAt.toISOString(),
    category: article.category,
  };
}

function toDraftDetail(article: DraftRow): DraftDetail {
  return {
    ...toDraftListItem(article),
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    body: article.body,
    blocks: readBlocks(article.blocks),
    topics: article.topics.map((t) => t.topic),
    reviewNote: article.reviewNote,
    isFeatured: article.isFeatured,
    isLive: article.isLive,
    featuredImageUrl: article.featuredImageUrl,
    featuredImageAlt: article.featuredImageAlt,
    featuredImageCredit: article.featuredImageCredit,
    createdAt: article.createdAt.toISOString(),
  };
}
