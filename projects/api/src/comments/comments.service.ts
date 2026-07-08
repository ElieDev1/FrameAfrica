import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, CommentStatus, Prisma } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  /** Visible comments for a published article, threaded (top-level + replies). */
  async listForArticle(articleId: string): Promise<CommentView[]> {
    const rows = await this.prisma.comment.findMany({
      where: { articleId, status: CommentStatus.visible, deletedAt: null },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return buildThread(rows);
  }

  /** Add a comment to a published article. */
  async create(userId: string, articleId: string, dto: CreateCommentDto): Promise<CommentView> {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.published, deletedAt: null },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Resolve the reply target and flatten to a single level: a reply to a reply
    // attaches to the original top-level comment.
    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, articleId, deletedAt: null },
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
      data: { articleId, authorId: userId, parentId, body },
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
      await this.prisma.$transaction([
        this.prisma.commentReport.create({
          data: { commentId, reporterId: userId, reason: reason?.slice(0, 500) || null },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { reportCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      // Duplicate report by the same user — a no-op, not an error.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
    return { reported: true };
  }

  /** Moderation queue: reported comments and anything pending review. */
  async listFlagged(): Promise<FlaggedComment[]> {
    const rows = await this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        OR: [{ reportCount: { gt: 0 } }, { status: CommentStatus.pending }],
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        article: { select: { slug: true, title: true } },
      },
      orderBy: [{ reportCount: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      status: row.status,
      reportCount: row.reportCount,
      createdAt: row.createdAt.toISOString(),
      author: row.author,
      article: row.article,
    }));
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
