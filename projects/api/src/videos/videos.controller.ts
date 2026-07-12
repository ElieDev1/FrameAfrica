import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { pagination, readPaging } from '../common/http/paging';
import { AddVideoDto } from './dto/add-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideosService } from './videos.service';

@Controller()
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  /** Public: the cached video hub (visible clips, featured first). */
  @Get('videos')
  async list(@Query('limit') limit?: string, @Query('page') page?: string, @Query('q') q?: string) {
    const paging = readPaging(limit, page, 12);
    const { items, hasMore } = await this.videos.listPage(paging.limit, paging.page, q);
    return apiResponse(items, pagination(paging.page, hasMore));
  }

  /** Public: one clip, for its own page (comments, likes, shares live there). */
  @Get('videos/:id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.videos.getPublic(id));
  }

  /** Admin: every cached clip, including hidden, for the management dashboard. */
  @Get('admin/videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async listAll() {
    return apiResponse(await this.videos.listAll());
  }

  /** Admin: pull the latest uploads from YouTube into the cache. */
  @Post('admin/videos/sync')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async sync() {
    return apiResponse(await this.videos.sync());
  }

  /** Admin: curate a single clip by URL. */
  @Post('admin/videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async add(@Body() dto: AddVideoDto) {
    return apiResponse(await this.videos.addByUrl(dto.url, dto.title));
  }

  /** Admin: feature/hide a clip. */
  @Patch('admin/videos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoDto) {
    return apiResponse(await this.videos.setFlags(id, dto));
  }

  /** Admin: remove a clip from the hub. */
  @Delete('admin/videos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.videos.remove(id);
    return apiResponse({ deleted: true });
  }
}
