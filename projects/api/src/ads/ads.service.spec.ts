import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { AdsService } from './ads.service';

function build() {
  const prisma = {
    houseAd: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { service: new AdsService(prisma as unknown as PrismaService), prisma };
}

describe('AdsService', () => {
  describe('serve', () => {
    it('returns null when no active ad exists', async () => {
      const { service, prisma } = build();
      prisma.houseAd.findMany.mockResolvedValue([]);
      expect(await service.serve('leaderboard')).toBeNull();
    });

    it('returns an ad and counts an impression', async () => {
      const { service, prisma } = build();
      prisma.houseAd.findMany.mockResolvedValue([
        {
          id: 'a1',
          title: 'T',
          imageUrl: null,
          linkUrl: 'https://x.com',
          placement: 'leaderboard',
        },
      ]);
      const ad = await service.serve('leaderboard');
      expect(ad?.id).toBe('a1');
      expect(prisma.houseAd.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { impressions: { increment: 1 } },
      });
    });
  });

  describe('click', () => {
    it('returns the link and counts a click', async () => {
      const { service, prisma } = build();
      prisma.houseAd.findUnique.mockResolvedValue({ linkUrl: 'https://x.com' });
      expect(await service.click('a1')).toBe('https://x.com');
      expect(prisma.houseAd.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { clicks: { increment: 1 } },
      });
    });

    it('404s an unknown ad', async () => {
      const { service, prisma } = build();
      prisma.houseAd.findUnique.mockResolvedValue(null);
      await expect(service.click('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
