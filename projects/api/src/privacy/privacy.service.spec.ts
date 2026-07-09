import { UnauthorizedException } from '@nestjs/common';
import type { AuditService } from '../audit/audit.service';
import type { PasswordService } from '../auth/password.service';
import type { TokenService } from '../auth/token.service';
import type { PrismaService } from '../prisma/prisma.service';
import { PrivacyService } from './privacy.service';

function build() {
  const prisma = {
    user: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    comment: { findMany: jest.fn().mockResolvedValue([]) },
    bookmark: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
    follow: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
    readingHistory: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
    articleLike: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
    commentLike: { deleteMany: jest.fn() },
    commentReport: { deleteMany: jest.fn() },
    notification: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
    userToken: { deleteMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const passwords = { verify: jest.fn() };
  const tokens = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new PrivacyService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    tokens as unknown as TokenService,
    audit as unknown as AuditService,
  );
  return { service, prisma, passwords, tokens, audit };
}

describe('PrivacyService', () => {
  describe('exportData', () => {
    it('assembles the profile and related data', async () => {
      const { service, prisma } = build();
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Aline',
        phone: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        lastLoginAt: null,
        roles: [{ role: { name: 'reader' } }],
      });
      prisma.bookmark.findMany.mockResolvedValue([
        { articleId: 'a1', createdAt: new Date('2026-02-01T00:00:00Z') },
      ]);

      const res = await service.exportData('u1');
      expect(res.profile.email).toBe('a@b.com');
      expect(res.profile.roles).toEqual(['reader']);
      expect(res.bookmarks).toEqual([{ articleId: 'a1', createdAt: '2026-02-01T00:00:00.000Z' }]);
    });
  });

  describe('eraseAccount', () => {
    it('rejects a wrong password without deleting anything', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'h', deletedAt: null });
      passwords.verify.mockResolvedValue(false);

      await expect(service.eraseAccount('u1', 'bad')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('scrubs, deletes personal data, and revokes sessions on success', async () => {
      const { service, prisma, passwords, tokens } = build();
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'h', deletedAt: null });
      passwords.verify.mockResolvedValue(true);

      await service.eraseAccount('u1', 'correct');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ status: 'deleted', displayName: 'Deleted user' }),
        }),
      );
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    });

    it('refuses an already-deleted account', async () => {
      const { service, prisma } = build();
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'h',
        deletedAt: new Date(),
      });
      await expect(service.eraseAccount('u1', 'x')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
