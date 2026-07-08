import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { LikesService } from './likes.service';

function build() {
  const prisma = {
    articleLike: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    article: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return { service: new LikesService(prisma as unknown as PrismaService), prisma };
}

describe('LikesService', () => {
  describe('like', () => {
    it('creates a like and bumps the count when not already liked', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' }); // published
      prisma.articleLike.findUnique.mockResolvedValue(null); // not yet liked
      prisma.article.findUnique.mockResolvedValue({ likeCount: 6 });

      const res = await service.like('u1', 'a1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(res).toEqual({ liked: true, likeCount: 6 });
    });

    it('is idempotent when already liked (no double count)', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue({ id: 'a1' });
      prisma.articleLike.findUnique.mockResolvedValue({ userId: 'u1' });
      prisma.article.findUnique.mockResolvedValue({ likeCount: 6 });

      const res = await service.like('u1', 'a1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(res.liked).toBe(true);
    });

    it('404s an unpublished/unknown article', async () => {
      const { service, prisma } = build();
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.like('u1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unlike', () => {
    it('removes a like and decrements when it existed', async () => {
      const { service, prisma } = build();
      prisma.articleLike.findUnique.mockResolvedValue({ userId: 'u1' });
      prisma.article.findUnique.mockResolvedValue({ likeCount: 5 });

      const res = await service.unlike('u1', 'a1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(res).toEqual({ liked: false, likeCount: 5 });
    });

    it('is a no-op when not liked', async () => {
      const { service, prisma } = build();
      prisma.articleLike.findUnique.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue({ likeCount: 5 });

      await service.unlike('u1', 'a1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('status', () => {
    it('reports liked + count', async () => {
      const { service, prisma } = build();
      prisma.articleLike.findUnique.mockResolvedValue({ userId: 'u1' });
      prisma.article.findUnique.mockResolvedValue({ likeCount: 9 });

      expect(await service.status('u1', 'a1')).toEqual({ liked: true, likeCount: 9 });
    });
  });
});
