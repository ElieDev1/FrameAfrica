import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import type { EngagementService } from '../engagement/engagement.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';
import { buildThread, CommentsService } from './comments.service';

const author = { id: 'u1', displayName: 'Reader', avatarUrl: null };
const commentRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  articleId: 'a1',
  authorId: 'u1',
  parentId: null as string | null,
  body: 'Hi',
  status: CommentStatus.visible,
  likeCount: 0,
  reportCount: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null as Date | null,
  author,
  ...over,
});

function build() {
  const prisma = {
    comment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    commentLike: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    commentReport: { create: jest.fn() },
    article: { findFirst: jest.fn() },
    user: {
      // Not banned by default so create() proceeds.
      findUnique: jest.fn().mockResolvedValue({ commentsBannedAt: null }),
      findFirst: jest.fn().mockResolvedValue({ id: 'u1' }),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([{}, { reportCount: 1, body: 'reported body' }]),
  };
  const notifications = { notifyRoles: jest.fn() };
  // Visible by default so create() proceeds; tests override to assert the 404.
  const engagement = { assertVisible: jest.fn().mockResolvedValue(undefined) };
  const service = new CommentsService(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
    engagement as unknown as EngagementService,
  );
  return { service, prisma, notifications, engagement };
}

/** First argument of a jest mock's first call, typed. */
function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('CommentsService', () => {
  describe('listForArticle', () => {
    it('queries only visible, non-deleted comments and threads replies', async () => {
      const { service, prisma } = build();
      prisma.comment.findMany.mockResolvedValue([
        commentRow({ id: 'c1', parentId: null }),
        commentRow({ id: 'c2', parentId: 'c1' }),
        commentRow({ id: 'c3', parentId: null }),
      ]);

      const res = await service.listForArticle('a1');

      const { where } = firstArg<{ where: Record<string, unknown> }>(prisma.comment.findMany);
      expect(where).toMatchObject({
        targetType: 'article',
        targetId: 'a1',
        status: 'visible',
        deletedAt: null,
      });
      expect(res).toHaveLength(2); // two top-level
      expect(res[0].replies.map((r) => r.id)).toEqual(['c2']);
    });
  });

  describe('create', () => {
    it('404s when the target is not published', async () => {
      const { service, engagement } = build();
      engagement.assertVisible.mockRejectedValue(new NotFoundException('Content not found'));
      await expect(service.create('u1', 'a1', { body: 'hello' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('strips HTML before storing (no stored markup)', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.comment.create.mockResolvedValue(commentRow({ body: 'hello world' }));

      await service.create('u1', 'a1', { body: 'hello <script>alert(1)</script>world' });

      const { data } = firstArg<{ data: { body: string } }>(prisma.comment.create);
      expect(data.body).toBe('hello alert(1)world');
      expect(data.body).not.toContain('<');
    });

    it('rejects a comment that is empty once stripped', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      await expect(service.create('u1', 'a1', { body: '<b></b>' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('flattens a reply-to-a-reply onto the original top-level comment', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.comment.findFirst.mockResolvedValue({ id: 'reply1', parentId: 'top1' });
      prisma.comment.create.mockResolvedValue(commentRow());

      await service.create('u1', 'a1', { body: 'nested', parentId: 'reply1' });

      const { data } = firstArg<{ data: { parentId: string } }>(prisma.comment.create);
      expect(data.parentId).toBe('top1');
    });
  });

  describe('like', () => {
    it('likes once and returns the count', async () => {
      const { service, prisma } = build();
      prisma.comment.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.commentLike.findUnique.mockResolvedValue(null);
      prisma.comment.findUnique.mockResolvedValue({ likeCount: 3 });

      const res = await service.like('u1', 'c1');
      expect(res).toEqual({ liked: true, likeCount: 3 });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('report', () => {
    it('flags a comment (idempotent on duplicate)', async () => {
      const { service, prisma } = build();
      prisma.comment.findFirst.mockResolvedValue({ id: 'c1' });
      const res = await service.report('u1', 'c1', 'spam');
      expect(res).toEqual({ reported: true });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('moderate', () => {
    it('hides a comment and clears the report count', async () => {
      const { service, prisma } = build();
      prisma.comment.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.comment.update.mockResolvedValue({ id: 'c1', status: 'hidden' });

      const res = await service.moderate('c1', 'hide');
      expect(res.status).toBe('hidden');
      const { data } = firstArg<{ data: { status: string; reportCount: number } }>(
        prisma.comment.update,
      );
      expect(data.status).toBe('hidden');
      expect(data.reportCount).toBe(0);
    });
  });

  describe('ban', () => {
    it('blocks a banned user from commenting', async () => {
      const { service, prisma } = build();
      prisma.user.findUnique.mockResolvedValue({ commentsBannedAt: new Date() });
      await expect(service.create('u1', 'a1', { body: 'hi' })).rejects.toMatchObject({
        status: 403,
      });
    });

    it('banUser stamps commentsBannedAt', async () => {
      const { service, prisma } = build();
      prisma.user.findFirst.mockResolvedValue({ id: 'u2' });
      const res = await service.banUser('u2');
      expect(res).toEqual({ id: 'u2', banned: true });
      const { data } = firstArg<{ data: { commentsBannedAt: Date } }>(prisma.user.update);
      expect(data.commentsBannedAt).toBeInstanceOf(Date);
    });

    it('unbanUser clears commentsBannedAt', async () => {
      const { service, prisma } = build();
      prisma.user.findFirst.mockResolvedValue({ id: 'u2' });
      const res = await service.unbanUser('u2');
      expect(res).toEqual({ id: 'u2', banned: false });
      const { data } = firstArg<{ data: { commentsBannedAt: Date | null } }>(prisma.user.update);
      expect(data.commentsBannedAt).toBeNull();
    });
  });

  it('buildThread nests replies under their parent and keeps roots ordered', () => {
    const thread = buildThread([
      commentRow({ id: 'a', parentId: null }),
      commentRow({ id: 'b', parentId: 'a' }),
    ]);
    expect(thread.map((c) => c.id)).toEqual(['a']);
    expect(thread[0].replies.map((c) => c.id)).toEqual(['b']);
  });
});
