import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { TokenService } from '../auth/token.service';
import { PrismaService } from '../prisma/prisma.service';
import type { DataExport } from './privacy.types';

/**
 * Reader privacy rights (documents/05 §9, Law N° 058/2021, `FR-AUTH-8`):
 * a machine-readable **data export** and **account erasure**. Erasure is a
 * PII-scrub + soft-delete: personal rows are removed and identifying columns
 * cleared, but authored content (comments/articles) is kept for thread and
 * publication integrity — attributed to an anonymised "Deleted user".
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async exportData(userId: string): Promise<DataExport> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    const [comments, bookmarks, follows, history, likes, notifications] = await Promise.all([
      this.prisma.comment.findMany({
        where: { authorId: userId },
        select: { body: true, articleId: true, createdAt: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId },
        select: { articleId: true, createdAt: true },
      }),
      this.prisma.follow.findMany({
        where: { userId },
        select: { categoryId: true, topicId: true, createdAt: true },
      }),
      this.prisma.readingHistory.findMany({
        where: { userId },
        select: { articleId: true, viewedAt: true },
      }),
      this.prisma.articleLike.findMany({
        where: { userId },
        select: { articleId: true, createdAt: true },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        select: { type: true, title: true, createdAt: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        roles: user.roles.map((r) => r.role.name),
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      },
      comments: comments.map((c) => ({
        body: c.body,
        articleId: c.articleId,
        createdAt: c.createdAt.toISOString(),
      })),
      bookmarks: bookmarks.map((b) => ({
        articleId: b.articleId,
        createdAt: b.createdAt.toISOString(),
      })),
      follows: follows.map((f) => ({
        categoryId: f.categoryId,
        topicId: f.topicId,
        createdAt: f.createdAt.toISOString(),
      })),
      readingHistory: history.map((h) => ({
        articleId: h.articleId,
        viewedAt: h.viewedAt.toISOString(),
      })),
      likes: likes.map((l) => ({ articleId: l.articleId, createdAt: l.createdAt.toISOString() })),
      notifications: notifications.map((n) => ({
        type: n.type,
        title: n.title,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Erase the account: verify the password, delete personal data, scrub
   * identifying columns, soft-delete, and revoke every session. Authored
   * comments/articles remain (now anonymised). Irreversible.
   */
  async eraseAccount(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Account not found');
    }
    const ok = user.passwordHash ? await this.passwords.verify(user.passwordHash, password) : false;
    if (!ok) {
      throw new UnauthorizedException('Password is incorrect');
    }

    await this.prisma.$transaction([
      this.prisma.bookmark.deleteMany({ where: { userId } }),
      this.prisma.follow.deleteMany({ where: { userId } }),
      this.prisma.readingHistory.deleteMany({ where: { userId } }),
      this.prisma.articleLike.deleteMany({ where: { userId } }),
      this.prisma.commentLike.deleteMany({ where: { userId } }),
      this.prisma.commentReport.deleteMany({ where: { reporterId: userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.userToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted+${userId}@deleted.invalid`,
          phone: null,
          displayName: 'Deleted user',
          avatarUrl: null,
          passwordHash: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          mustChangePassword: false,
          emailVerifiedAt: null,
          preferences: {},
          status: UserStatus.deleted,
          deletedAt: new Date(),
        },
      }),
    ]);

    // Outside the tx: invalidate all refresh sessions.
    await this.tokens.revokeAllForUser(userId);
    await this.audit.record({
      actorId: userId,
      action: 'account.erased',
      targetType: 'user',
      targetId: userId,
    });
  }
}
