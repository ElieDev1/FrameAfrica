import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

type RefreshTokenMock = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
};

const configStub = {
  get: (_key: string, def?: unknown) => def,
  getOrThrow: () => 'test-access-secret',
} as unknown as ConfigService;

function build(): { service: TokenService; refreshToken: RefreshTokenMock } {
  const refreshToken: RefreshTokenMock = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const prisma = { refreshToken } as unknown as PrismaService;
  const service = new TokenService(new JwtService({}), configStub, prisma);
  return { service, refreshToken };
}

describe('TokenService', () => {
  it('fails to construct when JWT_ACCESS_SECRET is not configured', () => {
    const throwingConfig = {
      get: (_key: string, def?: unknown) => def,
      getOrThrow: () => {
        throw new Error("JWT_ACCESS_SECRET doesn't exist");
      },
    } as unknown as ConfigService;

    expect(() => new TokenService(new JwtService({}), throwingConfig, {} as PrismaService)).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  describe('access tokens', () => {
    it('signs a token that verifies back to the same claims', async () => {
      const { service } = build();
      const token = await service.signAccessToken({ sub: 'u1', roles: ['reader'] });
      const claims = await service.verifyAccessToken(token);
      expect(claims.sub).toBe('u1');
      expect(claims.roles).toEqual(['reader']);
    });
  });

  describe('issueRefreshToken', () => {
    it('stores a hashed token and returns the raw token + family', async () => {
      const { service, refreshToken } = build();
      const issued = await service.issueRefreshToken('u1');

      expect(issued.token).toMatch(/^[a-f0-9]{64}$/);
      expect(issued.familyId).toMatch(/^[0-9a-f-]{36}$/);
      const calls = refreshToken.create.mock.calls as unknown[][];
      const arg = calls[0]?.[0] as {
        data: { tokenHash: string; userId: string };
      };
      expect(arg.data.userId).toBe('u1');
      expect(arg.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(arg.data.tokenHash).not.toBe(issued.token); // stored hash != raw
    });
  });

  describe('rotateRefreshToken', () => {
    it('rejects an unknown token', async () => {
      const { service, refreshToken } = build();
      refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.rotateRefreshToken('nope')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates a valid token: revokes the old and issues a new one in the family', async () => {
      const { service, refreshToken } = build();
      refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        familyId: 'fam1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = await service.rotateRefreshToken('raw');

      expect(res.userId).toBe('u1');
      expect(res.familyId).toBe('fam1');
      expect(refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt1' } }),
      );
      expect(refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('revokes the whole family when a rotated (revoked) token is replayed', async () => {
      const { service, refreshToken } = build();
      refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        familyId: 'fam1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.rotateRefreshToken('raw')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { familyId: 'fam1', revokedAt: null } }),
      );
    });

    it('rejects and revokes the family for an expired token', async () => {
      const { service, refreshToken } = build();
      refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        familyId: 'fam1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.rotateRefreshToken('raw')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshToken.updateMany).toHaveBeenCalled();
      expect(refreshToken.create).not.toHaveBeenCalled();
    });
  });
});
