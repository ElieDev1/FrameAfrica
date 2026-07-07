import { UserTokenType } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { MailerService } from '../mail/mail.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AccountService } from './account.service';
import type { OneTimeTokenService } from './one-time-token.service';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';

function build() {
  const prisma = {
    user: {
      update: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn(),
    },
  };
  const oneTime = {
    issue: jest.fn().mockResolvedValue('raw-token'),
    consume: jest.fn(),
    invalidateAll: jest.fn().mockResolvedValue(undefined),
  };
  const mailer = {
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };
  const passwords = { hash: jest.fn().mockResolvedValue('argon-hash'), verify: jest.fn() };
  const tokens = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
  const config = { get: (_k: string, d?: string) => d } as unknown as ConfigService;

  const service = new AccountService(
    prisma as unknown as PrismaService,
    oneTime as unknown as OneTimeTokenService,
    mailer as unknown as MailerService,
    passwords as unknown as PasswordService,
    tokens as unknown as TokenService,
    config,
  );
  return { service, prisma, oneTime, mailer, passwords, tokens };
}

const anyDate = expect.any(Date) as unknown as Date;

describe('AccountService', () => {
  describe('sendVerification', () => {
    it('invalidates old tokens, issues a fresh one, and emails the link', async () => {
      const { service, oneTime, mailer } = build();
      await service.sendVerification('u1', 'reader@example.test');
      expect(oneTime.invalidateAll).toHaveBeenCalledWith('u1', UserTokenType.email_verification);
      expect(oneTime.issue).toHaveBeenCalledWith(
        'u1',
        UserTokenType.email_verification,
        expect.any(Number),
      );
      expect(mailer.sendEmailVerification).toHaveBeenCalledWith('reader@example.test', 'raw-token');
    });
  });

  describe('verifyEmail', () => {
    it('consumes the token and stamps emailVerifiedAt', async () => {
      const { service, prisma, oneTime } = build();
      oneTime.consume.mockResolvedValue('u1');
      await service.verifyEmail('tok');
      expect(oneTime.consume).toHaveBeenCalledWith('tok', UserTokenType.email_verification);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { emailVerifiedAt: anyDate },
        }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('emails a reset link when the user exists', async () => {
      const { service, prisma, oneTime, mailer } = build();
      prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'reader@example.test' });
      await service.requestPasswordReset('reader@example.test');
      expect(oneTime.issue).toHaveBeenCalledWith(
        'u1',
        UserTokenType.password_reset,
        expect.any(Number),
      );
      expect(mailer.sendPasswordReset).toHaveBeenCalledWith('reader@example.test', 'raw-token');
    });

    it('stays silent for an unknown email — no token, no email (no enumeration)', async () => {
      const { service, prisma, oneTime, mailer } = build();
      prisma.user.findFirst.mockResolvedValue(null);
      await service.requestPasswordReset('nobody@example.test');
      expect(oneTime.issue).not.toHaveBeenCalled();
      expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('sets the new hash and revokes every session', async () => {
      const { service, prisma, oneTime, passwords, tokens } = build();
      oneTime.consume.mockResolvedValue('u1');
      await service.resetPassword('tok', 'brand-new-pw');
      expect(oneTime.consume).toHaveBeenCalledWith('tok', UserTokenType.password_reset);
      expect(passwords.hash).toHaveBeenCalledWith('brand-new-pw');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { passwordHash: 'argon-hash' } }),
      );
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    });
  });
});
