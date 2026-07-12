import { Injectable } from '@nestjs/common';
import { EngagementTarget } from '@prisma/client';
import { EngagementService } from '../engagement/engagement.service';

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

/**
 * Reader "likes" on published articles. Kept as its own thin service so the
 * existing `/articles/:id/like` routes stay put, but the work now happens in the
 * polymorphic EngagementService — an article is just one target type, and a
 * single like table sits behind every content type.
 */
@Injectable()
export class LikesService {
  constructor(private readonly engagement: EngagementService) {}

  async like(userId: string, articleId: string): Promise<LikeStatus> {
    return toStatus(await this.engagement.like(userId, EngagementTarget.article, articleId, true));
  }

  async unlike(userId: string, articleId: string): Promise<LikeStatus> {
    return toStatus(await this.engagement.like(userId, EngagementTarget.article, articleId, false));
  }

  async status(userId: string, articleId: string): Promise<LikeStatus> {
    return toStatus(await this.engagement.counts(EngagementTarget.article, articleId, userId));
  }
}

function toStatus(counts: { liked: boolean; likeCount: number }): LikeStatus {
  return { liked: counts.liked, likeCount: counts.likeCount };
}
