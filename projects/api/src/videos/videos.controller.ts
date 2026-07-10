import { Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { VideosService } from './videos.service';

@Controller()
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  /** Public: the cached video hub. */
  @Get('videos')
  async list(@Query('limit') limit?: string) {
    const n = Number(limit);
    return apiResponse(await this.videos.list(Number.isFinite(n) && n > 0 ? n : 12));
  }

  /** Admin: pull the latest uploads from YouTube into the cache. */
  @Post('admin/videos/sync')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async sync() {
    return apiResponse(await this.videos.sync());
  }
}
