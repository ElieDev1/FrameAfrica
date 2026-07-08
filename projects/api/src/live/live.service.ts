import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, type Prisma } from '@prisma/client';
import { stripText } from '../content/blocks';
import { PrismaService } from '../prisma/prisma.service';
import type { LiveUpdateDto } from './live.types';

const updateInclude = {
  author: { select: { displayName: true } },
} satisfies Prisma.LiveUpdateInclude;

type UpdateRow = Prisma.LiveUpdateGetPayload<{ include: typeof updateInclude }>;

export interface AddUpdateInput {
  headline?: string;
  body: string;
  isKeyEvent?: boolean;
}

/**
 * Live/developing coverage: a published article can carry a stream of
 * timestamped updates (`FR-LIVE`). Posting the first update flips the article
 * to `isLive`; ending coverage flips it back. Update text is markup-stripped.
 */
@Injectable()
export class LiveService {
  constructor(private readonly prisma: PrismaService) {}

  /** Post an update to a published article's live coverage (marks it live). */
  async addUpdate(
    articleId: string,
    authorId: string,
    input: AddUpdateInput,
  ): Promise<LiveUpdateDto> {
    await this.assertPublished(articleId);
    const body = stripText(input.body);
    if (!body) {
      throw new BadRequestException('A live update needs some text');
    }
    const headline = input.headline ? stripText(input.headline).slice(0, 200) : null;

    const [update] = await this.prisma.$transaction([
      this.prisma.liveUpdate.create({
        data: {
          articleId,
          authorId,
          body: body.slice(0, 4000),
          headline: headline || null,
          isKeyEvent: input.isKeyEvent ?? false,
        },
        include: updateInclude,
      }),
      this.prisma.article.update({ where: { id: articleId }, data: { isLive: true } }),
    ]);
    return toDto(update);
  }

  /** End live coverage (the update log stays; the LIVE banner comes down). */
  async endLive(articleId: string): Promise<{ id: string; isLive: boolean }> {
    await this.assertPublished(articleId);
    return this.prisma.article.update({
      where: { id: articleId },
      data: { isLive: false },
      select: { id: true, isLive: true },
    });
  }

  /** Public: a published article's updates, newest first (empty if none/unknown). */
  async listUpdates(slug: string): Promise<LiveUpdateDto[]> {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.published, deletedAt: null },
      select: { id: true },
    });
    if (!article) return [];
    const rows = await this.prisma.liveUpdate.findMany({
      where: { articleId: article.id },
      include: updateInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(toDto);
  }

  private async assertPublished(articleId: string): Promise<void> {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { status: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.status !== ArticleStatus.published) {
      throw new ConflictException('Live coverage is only for published articles');
    }
  }
}

function toDto(update: UpdateRow): LiveUpdateDto {
  return {
    id: update.id,
    headline: update.headline,
    body: update.body,
    isKeyEvent: update.isKeyEvent,
    createdAt: update.createdAt.toISOString(),
    author: update.author.displayName,
  };
}
