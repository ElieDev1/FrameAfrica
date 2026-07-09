import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FollowStatus, Follows, FollowTarget } from './follows.types';

/**
 * Reader follows of sections (categories) and topics. One follow per user per
 * subject; following is idempotent. Followed subjects surface in the account
 * "Following" list and drive the personalised "For You" feed.
 */
@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(userId: string, target: FollowTarget, id: string): Promise<FollowStatus> {
    if (target === 'section') {
      await this.assertSection(id);
      await this.prisma.follow.upsert({
        where: { userId_categoryId: { userId, categoryId: id } },
        update: {},
        create: { userId, categoryId: id },
      });
    } else {
      await this.assertTopic(id);
      await this.prisma.follow.upsert({
        where: { userId_topicId: { userId, topicId: id } },
        update: {},
        create: { userId, topicId: id },
      });
    }
    return { following: true };
  }

  async unfollow(userId: string, target: FollowTarget, id: string): Promise<FollowStatus> {
    const where = target === 'section' ? { userId, categoryId: id } : { userId, topicId: id };
    await this.prisma.follow.deleteMany({ where });
    return { following: false };
  }

  async status(userId: string, target: FollowTarget, id: string): Promise<FollowStatus> {
    const where = target === 'section' ? { userId, categoryId: id } : { userId, topicId: id };
    const existing = await this.prisma.follow.findFirst({ where, select: { id: true } });
    return { following: Boolean(existing) };
  }

  /** Everything the reader follows, newest first, split into sections and topics. */
  async list(userId: string): Promise<Follows> {
    const rows = await this.prisma.follow.findMany({
      where: { userId },
      include: {
        category: { select: { id: true, name: true, slug: true, isActive: true } },
        topic: { select: { id: true, name: true, slug: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sections = rows
      .map((r) => r.category)
      .filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.isActive)
      .map(({ id, name, slug }) => ({ id, name, slug }));
    const topics = rows
      .map((r) => r.topic)
      .filter((t): t is NonNullable<typeof t> => Boolean(t) && t!.isActive)
      .map(({ id, name, slug }) => ({ id, name, slug }));

    return { sections, topics };
  }

  private async assertSection(id: string): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Section not found');
    }
  }

  private async assertTopic(id: string): Promise<void> {
    const found = await this.prisma.topic.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Topic not found');
    }
  }

  /** Validate a `:target` path segment, or 400. */
  static parseTarget(value: string): FollowTarget {
    if (value === 'section' || value === 'topic') {
      return value;
    }
    throw new BadRequestException('Follow target must be "section" or "topic"');
  }
}
