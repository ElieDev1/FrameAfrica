import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { AccountService } from './account.service';
import { AuthService } from './auth.service';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';
import type { TwoFactorService } from './two-factor.service';

const userWithRoles = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'reader@frameafrica.rw',
  displayName: 'Reader One',
  avatarUrl: null,
  passwordHash: 'hashed',
  status: 'active',
  deletedAt: null,
  roles: [{ role: { name: 'reader' } }],
  ...over,
});

function build() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const passwords = { hash: jest.fn(), verify: jest.fn() };
  const tokens = {
    signAccessToken: jest.fn().mockResolvedValue('access.jwt'),
    issueRefreshToken: jest
      .fn()
      .mockResolvedValue({ token: 'refresh-raw', familyId: 'fam', expiresAt: new Date() }),
    rotateRefreshToken: jest.fn(),
    revokeToken: jest.fn(),
  };
  const account = { sendVerification: jest.fn().mockResolvedValue(undefined) };
  const twoFactor = { verify: jest.fn().mockReturnValue(true) };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    tokens as unknown as TokenService,
    account as unknown as AccountService,
    twoFactor as unknown as TwoFactorService,
  );
  return { service, prisma, passwords, tokens, account, twoFactor };
}

describe('AuthService', () => {
  describe('register', () => {
    it('rejects a duplicate email', async () => {
      const { service, prisma } = build();
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ email: 'a@b.rw', password: 'pw', displayName: 'A' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and returns a session without secrets', async () => {
      const { service, prisma, passwords, account } = build();
      prisma.user.findUnique.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('argon-hash');
      prisma.user.create.mockResolvedValue(userWithRoles());

      const res = await service.register({
        email: 'reader@frameafrica.rw',
        password: 'pw12345',
        displayName: 'Reader One',
      });

      expect(passwords.hash).toHaveBeenCalledWith('pw12345');
      expect(res.accessToken).toBe('access.jwt');
      expect(res.refreshToken).toBe('refresh-raw');
      expect(res.user).toEqual({
        id: 'u1',
        email: 'reader@frameafrica.rw',
        displayName: 'Reader One',
        avatarUrl: null,
        roles: ['reader'],
      });
      expect(res.user).not.toHaveProperty('passwordHash');
      expect(account.sendVerification).toHaveBeenCalledWith('u1', 'reader@frameafrica.rw');
    });

    it('still returns a session if the verification email fails to send', async () => {
      const { service, prisma, passwords, account } = build();
      prisma.user.findUnique.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('argon-hash');
      prisma.user.create.mockResolvedValue(userWithRoles());
      account.sendVerification.mockRejectedValue(new Error('smtp down'));

      const res = await service.register({
        email: 'reader@frameafrica.rw',
        password: 'pw12345',
        displayName: 'Reader One',
      });

      expect(res.accessToken).toBe('access.jwt');
    });

    it('turns a race-losing duplicate email into a 409 (not a raw DB error)', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findUnique.mockResolvedValue(null); // pre-check sees no row yet
      passwords.hash.mockResolvedValue('argon-hash');
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({ email: 'a@b.rw', password: 'pw123456', displayName: 'A' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      const { service, prisma } = build();
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login({ email: 'no@one.rw', password: 'pw' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('still hashes-verifies against a dummy hash for an unknown email (timing-safe)', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findFirst.mockResolvedValue(null);
      passwords.verify.mockResolvedValue(false);

      await expect(service.login({ email: 'no@one.rw', password: 'pw' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(passwords.verify).toHaveBeenCalledTimes(1);
      const [hashArg] = passwords.verify.mock.calls[0] as [string, string];
      expect(hashArg).toMatch(/^\$argon2id\$/);
      expect(hashArg).not.toBe('hashed'); // not a real user's hash — the dummy
    });

    it('rejects a wrong password', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findFirst.mockResolvedValue(userWithRoles());
      passwords.verify.mockResolvedValue(false);
      await expect(
        service.login({ email: 'reader@frameafrica.rw', password: 'bad' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a suspended account', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findFirst.mockResolvedValue(userWithRoles({ status: 'suspended' }));
      passwords.verify.mockResolvedValue(true);
      await expect(
        service.login({ email: 'reader@frameafrica.rw', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues a session and stamps lastLoginAt on success', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findFirst.mockResolvedValue(userWithRoles());
      passwords.verify.mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      const res = await service.login({
        email: 'reader@frameafrica.rw',
        password: 'pw',
      });

      expect(res.accessToken).toBe('access.jwt');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
    });

    it('demands a 2FA code when the account has 2FA enabled', async () => {
      const { service, prisma, passwords } = build();
      prisma.user.findFirst.mockResolvedValue(
        userWithRoles({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.login({ email: 'reader@frameafrica.rw', password: 'pw' }),
      ).rejects.toMatchObject({ message: '2FA_REQUIRED' });
    });

    it('rejects an invalid 2FA code', async () => {
      const { service, prisma, passwords, twoFactor } = build();
      prisma.user.findFirst.mockResolvedValue(
        userWithRoles({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      passwords.verify.mockResolvedValue(true);
      twoFactor.verify.mockReturnValue(false);

      await expect(
        service.login({ email: 'reader@frameafrica.rw', password: 'pw', token: '000000' }),
      ).rejects.toMatchObject({ message: '2FA_INVALID' });
    });

    it('accepts a valid 2FA code and issues a session', async () => {
      const { service, prisma, passwords, twoFactor } = build();
      prisma.user.findFirst.mockResolvedValue(
        userWithRoles({ twoFactorEnabled: true, twoFactorSecret: 'SECRET' }),
      );
      passwords.verify.mockResolvedValue(true);
      twoFactor.verify.mockReturnValue(true);
      prisma.user.update.mockResolvedValue({});

      const res = await service.login({
        email: 'reader@frameafrica.rw',
        password: 'pw',
        token: '123456',
      });
      expect(res.accessToken).toBe('access.jwt');
    });
  });

  describe('refresh', () => {
    it('rotates the token and returns a fresh access token', async () => {
      const { service, prisma, tokens } = build();
      tokens.rotateRefreshToken.mockResolvedValue({
        userId: 'u1',
        token: 'new-refresh',
        familyId: 'fam',
        expiresAt: new Date(),
      });
      prisma.user.findUnique.mockResolvedValue(userWithRoles());

      const res = await service.refresh('old-refresh');

      expect(res.refreshToken).toBe('new-refresh');
      expect(res.accessToken).toBe('access.jwt');
    });
  });

  describe('logout', () => {
    it('revokes the presented refresh token', async () => {
      const { service, tokens } = build();
      await service.logout('some-token');
      expect(tokens.revokeToken).toHaveBeenCalledWith('some-token');
    });
  });
});
