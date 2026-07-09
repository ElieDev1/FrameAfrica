import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { AnalyticsService } from './analytics.service';
import { TrackViewDto } from './dto/track-view.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Public, best-effort view beacon. Rate-limited to blunt abuse. */
  @Post('view')
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async view(@Body() dto: TrackViewDto): Promise<void> {
    await this.analytics.record(dto.path, dto.articleId, referrerHost(dto.referrer));
  }

  /** Real-time editor overview. */
  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.journalist, RoleName.editor, RoleName.admin)
  async overview() {
    return apiResponse(await this.analytics.overview());
  }
}

/** Reduce a referrer URL to its host (drops paths/query — no PII). */
function referrerHost(referrer?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).host || undefined;
  } catch {
    return undefined;
  }
}
