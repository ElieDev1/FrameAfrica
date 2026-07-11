import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { FollowsService } from './follows.service';

function build() {
  const prisma = {
    follow: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    category: { findFirst: jest.fn() },
    topic: { findFirst: jest.fn() },
  };
  return { service: new FollowsService(prisma as unknown as PrismaService), prisma };
}

describe('FollowsService', () => {
  describe('follow', () => {
    it('follows a section (idempotent upsert on userId+categoryId)', async () => {
      const { service, prisma } = build();
      prisma.category.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.follow.upsert.mockResolvedValue({});

      expect(await service.follow('u1', 'section', 'c1')).toEqual({ following: true });
      const arg = (
        prisma.follow.upsert.mock.calls[0] as [{ where: { userId_categoryId: unknown } }]
      )[0];
      expect(arg.where.userId_categoryId).toEqual({ userId: 'u1', categoryId: 'c1' });
    });

    it('follows a topic', async () => {
      const { service, prisma } = build();
      prisma.topic.findFirst.mockResolvedValue({ id: 't1' });
      prisma.follow.upsert.mockResolvedValue({});
      expect(await service.follow('u1', 'topic', 't1')).toEqual({ following: true });
    });

    it('404s an unknown/inactive section', async () => {
      const { service, prisma } = build();
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.follow('u1', 'section', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unfollow', () => {
    it('removes the follow', async () => {
      const { service, prisma } = build();
      prisma.follow.deleteMany.mockResolvedValue({ count: 1 });
      expect(await service.unfollow('u1', 'topic', 't1')).toEqual({ following: false });
      expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', topicId: 't1' },
      });
    });
  });

  describe('status', () => {
    it('reports following', async () => {
      const { service, prisma } = build();
      prisma.follow.findFirst.mockResolvedValue({ id: 'f1' });
      expect(await service.status('u1', 'section', 'c1')).toEqual({ following: true });
    });
  });

  describe('list', () => {
    it('splits into active sections and topics', async () => {
      const { service, prisma } = build();
      prisma.follow.findMany.mockResolvedValue([
        { category: { id: 'c1', name: 'Business', slug: 'business', isActive: true }, topic: null },
        { category: null, topic: { id: 't1', name: 'AI', slug: 'ai', isActive: true } },
        { category: { id: 'c2', name: 'Old', slug: 'old', isActive: false }, topic: null },
      ]);

      const res = await service.list('u1');
      expect(res.sections).toEqual([{ id: 'c1', name: 'Business', slug: 'business' }]);
      expect(res.topics).toEqual([{ id: 't1', name: 'AI', slug: 'ai' }]);
    });
  });

  describe('parseTarget', () => {
    it('accepts section/topic and rejects others', () => {
      expect(FollowsService.parseTarget('section')).toBe('section');
      expect(FollowsService.parseTarget('topic')).toBe('topic');
      expect(() => FollowsService.parseTarget('author')).toThrow(BadRequestException);
    });
  });
});
