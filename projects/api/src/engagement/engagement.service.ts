import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, EngagementTarget, MediaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EngagementCounts {
  likeCount: number;
  shareCount: number;
  commentCount: number;
  /** Whether the viewer has liked it (false when signed out). */
  liked: boolean;
}

/**
 * Likes, shares and comment counts for *any* content type (documents/14 §2).
 * Engagement is polymorphic — `(targetType, targetId)` — so galleries, podcast
 * episodes, interactives and videos get the same reaction surface as articles,
 * with one moderation queue behind them rather than a parallel system.
 *
 * The denormalised `likeCount` / `shareCount` columns on each content row are
 * kept in step inside a transaction, so the public numbers stay accurate.
 */
@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  /** Toggle a like. Returns the fresh counts. */
  async like(
    userId: string,
    type: EngagementTarget,
    id: string,
    liked: boolean,
  ): Promise<EngagementCounts> {
    await this.assertVisible(type, id);
    const existing = await this.findLike(userId, type, id);

    if (liked && !existing) {
      await this.prisma.$transaction([
        this.prisma.contentLike.create({ data: { userId, targetType: type, targetId: id } }),
        this.bump(type, id, 'likeCount', 1),
      ]);
    } else if (!liked && existing) {
      await this.prisma.$transaction([
        this.prisma.contentLike.delete({
          where: { userId_targetType_targetId: { userId, targetType: type, targetId: id } },
        }),
        this.bump(type, id, 'likeCount', -1),
      ]);
    }
    return this.counts(type, id, userId);
  }

  /**
   * Record a share. Anonymous — we count that it happened, never who did it, so
   * this needs no auth and stores no reader identity.
   */
  async share(type: EngagementTarget, id: string): Promise<EngagementCounts> {
    await this.assertVisible(type, id);
    await this.bump(type, id, 'shareCount', 1);
    return this.counts(type, id);
  }

  /** Current counts, plus whether this viewer has liked it. */
  async counts(type: EngagementTarget, id: string, userId?: string): Promise<EngagementCounts> {
    const [row, commentCount, existing] = await Promise.all([
      this.readCounters(type, id),
      this.prisma.comment.count({
        where: { targetType: type, targetId: id, status: 'visible', deletedAt: null },
      }),
      userId ? this.findLike(userId, type, id) : Promise.resolve(null),
    ]);
    return {
      likeCount: row?.likeCount ?? 0,
      shareCount: row?.shareCount ?? 0,
      commentCount,
      liked: Boolean(existing),
    };
  }

  private findLike(userId: string, type: EngagementTarget, id: string) {
    return this.prisma.contentLike.findUnique({
      where: { userId_targetType_targetId: { userId, targetType: type, targetId: id } },
      select: { userId: true },
    });
  }

  private readCounters(
    type: EngagementTarget,
    id: string,
  ): Promise<{ likeCount: number; shareCount: number } | null> {
    const select = { likeCount: true, shareCount: true };
    switch (type) {
      case EngagementTarget.article:
        return this.prisma.article.findUnique({ where: { id }, select });
      case EngagementTarget.gallery:
        return this.prisma.gallery.findUnique({ where: { id }, select });
      case EngagementTarget.episode:
        return this.prisma.podcastEpisode.findUnique({ where: { id }, select });
      case EngagementTarget.interactive:
        return this.prisma.interactive.findUnique({ where: { id }, select });
      case EngagementTarget.video:
        return this.prisma.video.findUnique({ where: { id }, select });
    }
  }

  /** Increment/decrement a counter column, clamped at zero by the caller's flow. */
  private bump(type: EngagementTarget, id: string, field: 'likeCount' | 'shareCount', by: number) {
    const data = { [field]: { increment: by } } as
      { likeCount: { increment: number } } | { shareCount: { increment: number } };
    switch (type) {
      case EngagementTarget.article:
        return this.prisma.article.update({ where: { id }, data });
      case EngagementTarget.gallery:
        return this.prisma.gallery.update({ where: { id }, data });
      case EngagementTarget.episode:
        return this.prisma.podcastEpisode.update({ where: { id }, data });
      case EngagementTarget.interactive:
        return this.prisma.interactive.update({ where: { id }, data });
      case EngagementTarget.video:
        return this.prisma.video.update({ where: { id }, data });
    }
  }

  /**
   * The target must exist and be publicly visible — you can't like or comment on
   * a draft, a soft-deleted row, or a hidden video.
   */
  async assertVisible(type: EngagementTarget, id: string): Promise<void> {
    const found = await this.findVisible(type, id);
    if (!found) throw new NotFoundException('Content not found');
  }

  private async findVisible(type: EngagementTarget, id: string): Promise<{ id: string } | null> {
    const select = { id: true };
    switch (type) {
      case EngagementTarget.article:
        return this.prisma.article.findFirst({
          where: { id, status: ArticleStatus.published, deletedAt: null },
          select,
        });
      case EngagementTarget.gallery:
        return this.prisma.gallery.findFirst({
          where: { id, status: MediaStatus.published, deletedAt: null },
          select,
        });
      case EngagementTarget.episode:
        return this.prisma.podcastEpisode.findFirst({
          where: { id, status: MediaStatus.published, deletedAt: null },
          select,
        });
      case EngagementTarget.interactive:
        return this.prisma.interactive.findFirst({
          where: { id, status: MediaStatus.published, deletedAt: null },
          select,
        });
      case EngagementTarget.video:
        return this.prisma.video.findFirst({ where: { id, isHidden: false }, select });
    }
  }
}
