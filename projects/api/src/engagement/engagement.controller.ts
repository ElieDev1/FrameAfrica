import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EngagementTarget } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/auth/optional-jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { ParseTargetPipe } from './parse-target.pipe';
import { LikeDto } from './dto/like.dto';
import { EngagementService } from './engagement.service';

/**
 * Likes / shares / counts for any content type:
 * `/engagement/{article|gallery|episode|interactive|video}/{id}`.
 */
@Controller('engagement/:type/:id')
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  /** Public counts. Signed in, also reports whether *you* liked it. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async counts(
    @Param('type', ParseTargetPipe) type: EngagementTarget,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return apiResponse(await this.engagement.counts(type, id, user?.id));
  }

  /** Like / unlike (requires auth). */
  @Post('like')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async like(
    @Param('type', ParseTargetPipe) type: EngagementTarget,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LikeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return apiResponse(await this.engagement.like(user.id, type, id, dto.liked));
  }

  /**
   * Record a share. No auth and no identity stored — we only count that a share
   * happened. Rate-limited so the counter can't be trivially inflated.
   */
  @Post('share')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async share(
    @Param('type', ParseTargetPipe) type: EngagementTarget,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return apiResponse(await this.engagement.share(type, id));
  }
}
