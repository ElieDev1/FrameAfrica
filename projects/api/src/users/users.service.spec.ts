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
    });
  });

  it('throws NotFound for an unknown or deleted user', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
