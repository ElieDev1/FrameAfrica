import { ConflictException } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import type { PasswordService } from '../auth/password.service';
import type { MailerService } from '../mail/mail.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';
import { generateTemporaryPassword } from './password-generator';

const userRow = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'new@frameafrica.rw',
  displayName: 'New Staff',
  avatarUrl: null,
  status: UserStatus.active,
  mustChangePassword: true,
  lockedAt: null as Date | null,
  lastLoginAt: null as Date | null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  roles: [{ role: { name: RoleName.journalist } }],
  ...over,
});

function build() {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const passwords = { hash: jest.fn().mockResolvedValue('hashed') };
  const mailer = { sendTemporaryPassword: jest.fn().mockResolvedValue(undefined) };
  const service = new AdminUsersService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    mailer as unknown as MailerService,
  );
  return { service, prisma, passwords, mailer };
}

/** First argument of a jest mock's first call, typed. */
function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('generateTemporaryPassword', () => {
  it('meets length and character-class requirements', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTemporaryPassword();
      expect(pw.length).toBe(14);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
    }
  });
});

describe('AdminUsersService', () => {
  describe('create', () => {
    it('generates a temp password, flags change-required, and returns it once', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.create.mockResolvedValue(userRow());

      const res = await service.create({
        email: 'new@frameafrica.rw',
        displayName: 'New Staff',
        roles: [RoleName.journalist],
      });

      expect(passwords.hash).toHaveBeenCalledTimes(1);
      const { data } = firstArg<{ data: { mustChangePassword: boolean } }>(prisma.user.create);
      expect(data.mustChangePassword).toBe(true);
      expect(res.temporaryPassword).toHaveLength(14);
      expect(res.user.mustChangePassword).toBe(true);
    });

    it('409s on a duplicate email', async () => {
      const { service, prisma } = build();
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: '6',
        }),
      );
      await expect(
        service.create({ email: 'dupe@x.rw', displayName: 'D', roles: [RoleName.reader] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('resetPassword', () => {
    it('sets a new temp password, emails it, and returns it once to the admin', async () => {
      const { service, prisma, mailer } = build();
      prisma.user.findFirst.mockResolvedValue({ email: 'ret@frameafrica.rw' });
      prisma.user.update.mockResolvedValue(userRow());

      const res = await service.resetPassword('u1');

      expect(res.email).toBe('ret@frameafrica.rw');
      expect(res.emailed).toBe(true);
      expect(typeof res.temporaryPassword).toBe('string');
      expect(res.temporaryPassword.length).toBeGreaterThan(0);
      // The admin gets the same password that was emailed.
      expect(mailer.sendTemporaryPassword).toHaveBeenCalledWith(
        'ret@frameafrica.rw',
        res.temporaryPassword,
      );
      const { data } = firstArg<{ data: { mustChangePassword: boolean } }>(prisma.user.update);
      expect(data.mustChangePassword).toBe(true);
    });
  });

  describe('unlock', () => {
    it('clears the lock and resets the failure counter', async () => {
      const { service, prisma } = build();
      prisma.user.findFirst.mockResolvedValue({ email: 'locked@frameafrica.rw' });
      prisma.user.update.mockResolvedValue(userRow({ lockedAt: null }));

      const res = await service.unlock('u1');

      const { data } = firstArg<{ data: { failedLoginAttempts: number; lockedAt: null } }>(
        prisma.user.update,
      );
      expect(data.failedLoginAttempts).toBe(0);
      expect(data.lockedAt).toBeNull();
      expect(res.locked).toBe(false);
    });
  });

  describe('setStatus', () => {
    it('soft-deletes when status is deleted', async () => {
      const { service, prisma } = build();
      prisma.user.findFirst.mockResolvedValue({ email: 'x@x.rw' });
      prisma.user.update.mockResolvedValue(userRow({ status: UserStatus.deleted }));

      await service.setStatus('u1', UserStatus.deleted);

      const { data } = firstArg<{ data: { deletedAt: Date | null } }>(prisma.user.update);
      expect(data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
