import { UnauthorizedException } from '@nestjs/common';
import { UserTokenType } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { OneTimeTokenService } from './one-time-token.service';

function build() {
  const prisma = {
    userToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const service = new OneTimeTokenService(prisma as unknown as PrismaService);
  return { service, prisma };
}

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);
const anyDate = expect.any(Date) as unknown as Date;

describe('OneTimeTokenService', () => {
  it('issues a token whose hash (not the raw value) is stored', async () => {
    const { service, prisma } = build();
    let storedHash = '';
    prisma.userToken.create.mockImplementation((args: { data: { tokenHash: string } }) => {
      storedHash = args.data.tokenHash;
      return Promise.resolve({});
    });

    const raw = await service.issue('u1', UserTokenType.password_reset, 60_000);

    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(storedHash).not.toBe(raw); // stored value is the hash, not the raw token
    expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('consumes a valid token, marks it used, and returns the userId', async () => {
    const { service, prisma } = build();
    prisma.userToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: UserTokenType.email_verification,
      usedAt: null,
      expiresAt: future(),
    });

    const userId = await service.consume('raw', UserTokenType.email_verification);
    expect(userId).toBe('u1');
    expect(prisma.userToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't1' }, data: { usedAt: anyDate } }),
    );
  });

  it.each([
    ['unknown', null],
    [
      'wrong type',
      {
        id: 't',
        userId: 'u1',
        type: UserTokenType.password_reset,
        usedAt: null,
        expiresAt: future(),
      },
    ],
    [
      'already used',
      {
        id: 't',
        userId: 'u1',
        type: UserTokenType.email_verification,
        usedAt: new Date(),
        expiresAt: future(),
      },
    ],
    [
      'expired',
      {
        id: 't',
        userId: 'u1',
        type: UserTokenType.email_verification,
        usedAt: null,
        expiresAt: past(),
      },
    ],
  ])('rejects a %s token', async (_label, record) => {
    const { service, prisma } = build();
    prisma.userToken.findUnique.mockResolvedValue(record);
    await expect(service.consume('raw', UserTokenType.email_verification)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('does not mark an invalid token as used', async () => {
    const { service, prisma } = build();
    prisma.userToken.findUnique.mockResolvedValue(null);
    await expect(service.consume('raw', UserTokenType.password_reset)).rejects.toThrow();
    expect(prisma.userToken.update).not.toHaveBeenCalled();
  });
});
