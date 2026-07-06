import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { slugify } from '../../common/slug';
import { PrismaService } from '../../prisma/prisma.service';
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

    const body = dto.body ?? '';
    const article = await this.prisma.article.create({
      data: {
        slug: await this.uniqueSlug(slugify(dto.title)),
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        excerpt: dto.excerpt ?? null,
        body,
        language: dto.language ?? 'en',
        isPremium: dto.isPremium ?? false,
        status: ArticleStatus.draft,
        readTimeMin: readTime(body),
        author: { connect: { id: authorId } },
        category: { connect: { id: dto.categoryId } },
        revisions: {
          create: [
            {
              editor: { connect: { id: authorId } },
              title: dto.title,
              body,
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
    if (dto.body !== undefined) {
      data.body = dto.body;
      data.readTimeMin = readTime(dto.body);
    }
    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
      data.category = { connect: { id: dto.categoryId } };
    }

    data.revisions = {
      create: [
        {
          editor: { connect: { id: authorId } },
          title: dto.title ?? existing.title,
          body: dto.body ?? existing.body,
          changeNote: dto.changeNote ?? null,
        },
      ],
    };

    const updated = await this.prisma.article.update({
      where: { id },
      data,
      include: draftInclude,
    });
    return toDraftDetail(updated);
  }

  /** Submit a draft for editorial review (→ `ready`). */
  async submitDraft(authorId: string, id: string): Promise<DraftDetail> {
    await this.ownEditable(authorId, id);
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.ready },
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
    createdAt: article.createdAt.toISOString(),
  };
}
