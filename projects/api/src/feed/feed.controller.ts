import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { ContentService } from '../content/content.service';
import { ListArticlesQueryDto } from '../content/dto/list-articles-query.dto';

/**
 * The signed-in reader's personalised "For You" feed, built from the sections
 * and topics they follow plus their reading history (documents/14 §2).
 */
@Controller('me/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly content: ContentService) {}

  @Get()
  async feed(@CurrentUser() user: AuthenticatedUser, @Query() query: ListArticlesQueryDto) {
    const { items, nextCursor, hasMore, personalized } = await this.content.personalizedFeed(
      user.id,
      query,
    );
    const res = apiResponse(items, { nextCursor, hasMore });
    // Surface whether the feed is truly personalised (vs. the latest-news fallback).
    return { ...res, meta: { ...res.meta, personalized } };
  }
}
