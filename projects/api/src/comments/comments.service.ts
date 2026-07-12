import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, EngagementTarget, NotificationType, Prisma } from '@prisma/client';
import { EngagementService } from '../engagement/engagement.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CommentView, FlaggedComment, LikeResult } from './comments.types';
import type { CreateCommentDto } from './dto/create-comment.dto';

export type ModerationAction = 'keep' | 'hide' | 'remove';

const commentInclude = {
  author: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.CommentInclude;

type CommentRow = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

/**
 * Reader comments. Public reads return only `visible` comments; writes require
 * auth and are stored as plain text (documents/05 §6 — no HTML is persisted, so
 * a comment can never carry stored markup/script). Threading is one level deep.
 */
@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly engagement: EngagementService,
  ) {}

  /** Visible comments on an article — the article is just one target type. */
  listForArticle(articleId: string): Promise<CommentView[]> {
    return this.listFor(EngagementTarget.article, articleId);
  }

  /** Add a comment to a published article. */
  create(userId: string, articleId: string, dto: CreateCommentDto): Promise<CommentView> {
    return this.createFor(userId, EngagementTarget.article, articleId, dto);
  }

  /**
   * Visible comments on *any* content type, threaded (top-level + replies).
   * Galleries, podcast episodes, interactives and videos all read through here.
   */
  async listFor(type: EngagementTarget, targetId: string): Promise<CommentView[]> {
    const rows = await this.prisma.comment.findMany({
      where: { targetType: type, targetId, status: CommentStatus.visible, deletedAt: null },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return buildThread(rows);
  }

  /** Add a comment to any published content. */
  async createFor(
    userId: string,
    type: EngagementTarget,
    targetId: string,
    dto: CreateCommentDto,
  ): Promise<CommentView> {
    // Banned users can still read, but not post (documents/14 §2).
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { commentsBannedAt: true },
    });
    if (author?.commentsBannedAt) {
      throw new ForbiddenException('You are banned from commenting');
    }

    // 404s on a draft, a soft-deleted row, or a hidden video.
    await this.engagement.assertVisible(type, targetId);

    // Resolve the reply target and flatten to a single level: a reply to a reply
    // attaches to the original top-level comment.
    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, targetType: type, targetId, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!parent) {
        throw new BadRequestException('Parent comment not found');
      }
      parentId = parent.parentId ?? parent.id;
    }

    const body = sanitize(dto.body);
    if (!body) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const created = await this.prisma.comment.create({
      data: {
        targetType: type,
        targetId,
        // Articles keep the FK too, so their cascade-on-delete still applies.
        articleId: type === EngagementTarget.article ? targetId : null,
        authorId: userId,
        parentId,
        body,
      },
      include: commentInclude,
    });
    return toView(created);
  }

  /** Like a comment (idempotent; keeps the denormalised count accurate). */
  async like(userId: string, commentId: string): Promise<LikeResult> {
    await this.assertComment(commentId);
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
      select: { userId: true },
    });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    }
    return { liked: true, likeCount: await this.likeCount(commentId) };
  }

  async unlike(userId: string, commentId: string): Promise<LikeResult> {
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
      select: { userId: true },
    });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
    }
    return { liked: false, likeCount: await this.likeCount(commentId) };
  }

  /** Flag a comment for moderator review (one report per user; idempotent). */
  async report(userId: string, commentId: string, reason?: string): Promise<{ reported: true }> {
    await this.assertComment(commentId);
    try {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.commentReport.create({
          data: { commentId, reporterId: userId, reason: reason?.slice(0, 500) || null },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { reportCount: { increment: 1 } },
          select: { reportCount: true, body: true },
        }),
      ]);
      // Alert moderators only when a comment first becomes flagged, so a pile-on
      // of reports on the same comment doesn't flood the bell.
      if (updated.reportCount === 1) {
        await this.notifications.notifyRoles(['moderator', 'editor', 'admin'], {
          type: NotificationType.comment_reported,
          title: 'Comment reported for review',
          body: updated.body.slice(0, 160),
          link: '/dashboard/moderation',
        });
      }
    } catch (error) {
      // Duplicate report by the same user — a no-op, not an error.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
    return { reported: true };
  }

  /**
   * Moderation queue: reported comments and anything pending review, across
   * every content type. Each row carries the title + public URL of whatever it
   * was posted on, so a moderator can open a gallery or podcast as easily as an
   * article.
   */
  async listFlagged(): Promise<FlaggedComment[]> {
    const rows = await this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        OR: [{ reportCount: { gt: 0 } }, { status: CommentStatus.pending }],
      },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true, commentsBannedAt: true },
        },
      },
      orderBy: [{ reportCount: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const targets = await this.resolveTargets(rows);

    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      status: row.status,
      reportCount: row.reportCount,
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.author.id,
        displayName: row.author.displayName,
        avatarUrl: row.author.avatarUrl,
        banned: row.author.commentsBannedAt !== null,
      },
      target: targets.get(`${row.targetType}:${row.targetId}`) ?? {
        type: row.targetType,
        title: 'Deleted content',
        url: null,
      },
    }));
  }

  /** Batch-load the title + URL of everything the flagged comments hang off. */
  private async resolveTargets(
    rows: { targetType: EngagementTarget; targetId: string }[],
  ): Promise<Map<string, { type: EngagementTarget; title: string; url: string | null }>> {
    const byType = new Map<EngagementTarget, string[]>();
    for (const r of rows) {
      byType.set(r.targetType, [...(byType.get(r.targetType) ?? []), r.targetId]);
    }
    const out = new Map<string, { type: EngagementTarget; title: string; url: string | null }>();
    const add = (
      type: EngagementTarget,
      items: { id: string; title: string; url: string | null }[],
    ) => {
      for (const i of items) out.set(`${type}:${i.id}`, { type, title: i.title, url: i.url });
    };

    await Promise.all(
      [...byType.entries()].map(async ([type, ids]) => {
        switch (type) {
          case EngagementTarget.article: {
            const rowsFound = await this.prisma.article.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true, slug: true },
            });
            return add(
              type,
              rowsFound.map((a) => ({ id: a.id, title: a.title, url: `/article/${a.slug}` })),
            );
          }
          case EngagementTarget.gallery: {
            const rowsFound = await this.prisma.gallery.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true, slug: true },
            });
            return add(
              type,
              rowsFound.map((g) => ({ id: g.id, title: g.title, url: `/galleries/${g.slug}` })),
            );
          }
          case EngagementTarget.episode: {
            const rowsFound = await this.prisma.podcastEpisode.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true, show: { select: { slug: true } } },
            });
            return add(
              type,
              rowsFound.map((e) => ({
                id: e.id,
                title: e.title,
                url: `/podcasts/${e.show.slug}`,
              })),
            );
          }
          case EngagementTarget.interactive: {
            const rowsFound = await this.prisma.interactive.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true, slug: true },
            });
            return add(
              type,
              rowsFound.map((i) => ({ id: i.id, title: i.title, url: `/interactives/${i.slug}` })),
            );
          }
          case EngagementTarget.video: {
            const rowsFound = await this.prisma.video.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true },
            });
            return add(
              type,
              rowsFound.map((v) => ({ id: v.id, title: v.title, url: '/videos' })),
            );
          }
        }
      }),
    );
    return out;
  }

  /** Ban a user from commenting (moderator). Their existing comments stay. */
  async banUser(userId: string): Promise<{ id: string; banned: true }> {
    await this.assertUser(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { commentsBannedAt: new Date() },
    });
    return { id: userId, banned: true };
  }

  /** Lift a comment ban (moderator). */
  async unbanUser(userId: string): Promise<{ id: string; banned: false }> {
    await this.assertUser(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { commentsBannedAt: null },
    });
    return { id: userId, banned: false };
  }

  private async assertUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
  }

  /** Moderator action: keep (clears flags), hide, or remove a comment. */
  async moderate(
    commentId: string,
    action: ModerationAction,
  ): Promise<{ id: string; status: string }> {
    await this.assertComment(commentId);
    const status =
      action === 'keep'
        ? CommentStatus.visible
        : action === 'hide'
          ? CommentStatus.hidden
          : CommentStatus.removed;
    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { status, reportCount: 0 },
      select: { id: true, status: true },
    });
    return updated;
  }

  /** Hard-ish delete: soft-delete a comment so it leaves every public thread. */
  async softDelete(commentId: string): Promise<{ id: string; deleted: true }> {
    await this.assertComment(commentId);
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date(), status: CommentStatus.removed },
    });
    return { id: commentId, deleted: true };
  }

  private async assertComment(commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
  }

  private async likeCount(commentId: string): Promise<number> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { likeCount: true },
    });
    return comment?.likeCount ?? 0;
  }
}

/** Strip any HTML and collapse surrounding whitespace — comments are plain text. */
function sanitize(raw: string): string {
  return raw.replace(/<[^>]*>/g, '').trim();
}

function toView(row: CommentRow): CommentView {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    likeCount: row.likeCount,
    author: row.author,
    replies: [],
  };
}

/** Assemble a flat list into top-level comments each holding their replies. */
export function buildThread(rows: CommentRow[]): CommentView[] {
  const views = new Map<string, CommentView>();
  for (const row of rows) views.set(row.id, toView(row));

  const roots: CommentView[] = [];
  for (const row of rows) {
    const node = views.get(row.id)!;
    const parent = row.parentId ? views.get(row.parentId) : undefined;
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
