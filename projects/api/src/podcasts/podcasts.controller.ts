import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { CreateEpisodeDto, UpdateEpisodeDto } from './dto/episode.dto';
import { CreateShowDto, UpdateShowDto } from './dto/show.dto';
import { PodcastsService } from './podcasts.service';

@Controller()
export class PodcastsController {
  constructor(private readonly podcasts: PodcastsService) {}

  // --- Public ---

  @Get('podcasts')
  async listShows() {
    return apiResponse(await this.podcasts.listShows());
  }

  @Get('podcasts/:slug')
  async getShow(@Param('slug') slug: string) {
    return apiResponse(await this.podcasts.getShow(slug));
  }

  // --- Staff (editor + admin) ---

  @Get('admin/podcasts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async listAll() {
    return apiResponse(await this.podcasts.listAllShows());
  }

  @Get('admin/podcasts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.podcasts.getShowById(id));
  }

  @Post('admin/podcasts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async createShow(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShowDto) {
    return apiResponse(await this.podcasts.createShow(user.id, dto));
  }

  @Patch('admin/podcasts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async updateShow(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShowDto) {
    return apiResponse(await this.podcasts.updateShow(id, dto));
  }

  @Delete('admin/podcasts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async removeShow(@Param('id', ParseUUIDPipe) id: string) {
    await this.podcasts.removeShow(id);
    return apiResponse({ deleted: true });
  }

  @Post('admin/podcasts/:id/episodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async createEpisode(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateEpisodeDto) {
    return apiResponse(await this.podcasts.createEpisode(id, dto));
  }

  @Patch('admin/podcast-episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async updateEpisode(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEpisodeDto) {
    return apiResponse(await this.podcasts.updateEpisode(id, dto));
  }

  @Delete('admin/podcast-episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async removeEpisode(@Param('id', ParseUUIDPipe) id: string) {
    await this.podcasts.removeEpisode(id);
    return apiResponse({ deleted: true });
  }
}
