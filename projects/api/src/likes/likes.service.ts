import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

/**
 * Reader "likes" on published articles. One like per user per article; the
 * denormalised `article.likeCount` is kept in step inside a transaction so the
 * public count stays accurate.
 */
@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, articleId: string): Promise<LikeStatus> {
    await this.assertPublished(articleId);
    const existing = await this.find(userId, articleId);
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.articleLike.create({ data: { userId, articleId } }),
        this.prisma.article.update({
          where: { id: articleId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    }
    return { liked: true, likeCount: await this.count(articleId) };
  }

  async unlike(userId: string, articleId: string): Promise<LikeStatus> {
    const existing = await this.find(userId, articleId);
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.articleLike.delete({ where: { userId_articleId: { userId, articleId } } }),
        this.prisma.article.update({
          where: { id: articleId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
    }
    return { liked: false, likeCount: await this.count(articleId) };
  }

  async status(userId: string, articleId: string): Promise<LikeStatus> {
    const [existing, likeCount] = await Promise.all([
      this.find(userId, articleId),
      this.count(articleId),
    ]);
    return { liked: Boolean(existing), likeCount };
  }

  private find(userId: string, articleId: string) {
    return this.prisma.articleLike.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { userId: true },
    });
  }

  private async count(articleId: string): Promise<number> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { likeCount: true },
    });
    return article?.likeCount ?? 0;
  }

  private async assertPublished(articleId: string): Promise<void> {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.published, deletedAt: null },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
  }
}
