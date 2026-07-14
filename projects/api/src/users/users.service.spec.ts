import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

function build() {
  const prisma = { user: { findFirst: jest.fn() } };
  const service = new UsersService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('UsersService', () => {
  it('maps a user row to a profile', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'reader@frameafrica.rw',
      displayName: 'Reader One',
      avatarUrl: null,
      emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      roles: [{ role: { name: 'reader' } }],
    });

    const profile = await service.getProfile('u1');

    expect(profile).toEqual({
      id: 'u1',
      email: 'reader@frameafrica.rw',
      displayName: 'Reader One',
      avatarUrl: null,
      roles: ['reader'],
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      // A reader with no subscription date is not a member.
      subscribedUntil: null,
      isSubscriber: false,
    });
  });

  it('reads a future subscription date as a member, and a past one as lapsed', async () => {
    const { service, prisma } = build();
    const base = {
      id: 'u1',
      email: 'r@frameafrica.rw',
      displayName: 'R',
      avatarUrl: null,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      roles: [{ role: { name: 'reader' } }],
    };

    prisma.user.findFirst.mockResolvedValue({
      ...base,
      subscribedUntil: new Date(Date.now() + 30 * 24 * 3600_000),
    });
    expect((await service.getProfile('u1')).isSubscriber).toBe(true);

    prisma.user.findFirst.mockResolvedValue({
      ...base,
      subscribedUntil: new Date(Date.now() - 1000),
    });
    expect((await service.getProfile('u1')).isSubscriber).toBe(false);
  });

  it('throws NotFound for an unknown or deleted user', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
