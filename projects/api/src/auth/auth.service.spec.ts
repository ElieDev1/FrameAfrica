import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';

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
  const service = new AuthService(
    prisma as unknown as PrismaService,
    passwords as unknown as PasswordService,
    tokens as unknown as TokenService,
  );
  return { service, prisma, passwords, tokens };
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
      const { service, prisma, passwords } = build();
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
