import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, CommentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CommentView } from './comments.types';
import type { CreateCommentDto } from './dto/create-comment.dto';

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
