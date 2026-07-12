import { NotFoundException } from '@nestjs/common';
import { EngagementTarget } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { EngagementService } from './engagement.service';

function build() {
  const prisma = {
    contentLike: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    comment: { count: jest.fn().mockResolvedValue(0) },
    article: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    gallery: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    podcastEpisode: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    interactive: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    video: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return { service: new EngagementService(prisma as unknown as PrismaService), prisma };
}

describe('EngagementService', () => {
  describe('like', () => {
    it('likes a gallery and bumps its counter', async () => {
      const { service, prisma } = build();
      prisma.gallery.findFirst.mockResolvedValue({ id: 'g1' }); // published
      prisma.contentLike.findUnique.mockResolvedValue(null); // not liked yet
      prisma.gallery.findUnique.mockResolvedValue({ likeCount: 4, shareCount: 1 });

      const res = await service.like('u1', EngagementTarget.gallery, 'g1', true);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(res).toMatchObject({ liked: false, likeCount: 4, shareCount: 1 });
    });

    it('is idempotent — liking twice does not double-count', async () => {
      const { service, prisma } = build();
      prisma.video.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.contentLike.findUnique.mockResolvedValue({ userId: 'u1' }); // already liked
      prisma.video.findUnique.mockResolvedValue({ likeCount: 9, shareCount: 0 });

      await service.like('u1', EngagementTarget.video, 'v1', true);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('unlikes only when a like exists', async () => {
      const { service, prisma } = build();
      prisma.video.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.contentLike.findUnique.mockResolvedValue(null); // nothing to remove
      prisma.video.findUnique.mockResolvedValue({ likeCount: 0, shareCount: 0 });

      await service.like('u1', EngagementTarget.video, 'v1', false);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('404s a draft / hidden target', async () => {
      const { service, prisma } = build();
      prisma.interactive.findFirst.mockResolvedValue(null);
      await expect(
        service.like('u1', EngagementTarget.interactive, 'i1', true),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('share', () => {
    it('increments the share counter without needing a user', async () => {
      const { service, prisma } = build();
      prisma.podcastEpisode.findFirst.mockResolvedValue({ id: 'e1' });
      prisma.podcastEpisode.findUnique.mockResolvedValue({ likeCount: 0, shareCount: 3 });

      const res = await service.share(EngagementTarget.episode, 'e1');

      expect(prisma.podcastEpisode.update).toHaveBeenCalledTimes(1);
      expect(res.shareCount).toBe(3);
      // Anonymous: a share never records who did it.
      expect(prisma.contentLike.create).not.toHaveBeenCalled();
    });
  });

  describe('counts', () => {
    it('reports counts and that an anonymous viewer has not liked it', async () => {
      const { service, prisma } = build();
      prisma.article.findUnique.mockResolvedValue({ likeCount: 12, shareCount: 5 });
      prisma.comment.count.mockResolvedValue(7);

      const res = await service.counts(EngagementTarget.article, 'a1');

      expect(res).toEqual({ likeCount: 12, shareCount: 5, commentCount: 7, liked: false });
      expect(prisma.contentLike.findUnique).not.toHaveBeenCalled();
    });

    it('only counts visible comments', async () => {
      const { service, prisma } = build();
      prisma.article.findUnique.mockResolvedValue({ likeCount: 0, shareCount: 0 });

      await service.counts(EngagementTarget.article, 'a1');

      const arg = (prisma.comment.count.mock.calls[0] as [{ where: Record<string, unknown> }])[0];
      expect(arg.where).toMatchObject({ status: 'visible', deletedAt: null });
    });
  });
});
