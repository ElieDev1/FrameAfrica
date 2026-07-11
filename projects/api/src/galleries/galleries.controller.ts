import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleriesService } from './galleries.service';

@Controller()
export class GalleriesController {
  constructor(private readonly galleries: GalleriesService) {}

  /** Public: the published gallery hub. */
  @Get('galleries')
  async list(@Query('limit') limit?: string) {
    const n = Number(limit);
    return apiResponse(await this.galleries.listPublished(Number.isFinite(n) && n > 0 ? n : 24));
  }

  /** Public: a single published gallery. */
  @Get('galleries/:slug')
  async detail(@Param('slug') slug: string) {
    return apiResponse(await this.galleries.getBySlug(slug));
  }

  // --- Staff management (photographers + editors + admins) ---

  @Get('admin/galleries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async listAll() {
    return apiResponse(await this.galleries.listAll());
  }

  @Get('admin/galleries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.galleries.getById(id));
  }

  @Post('admin/galleries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGalleryDto) {
    return apiResponse(await this.galleries.create(user.id, dto));
  }

  @Patch('admin/galleries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGalleryDto) {
    return apiResponse(await this.galleries.update(id, dto));
  }

  @Delete('admin/galleries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.galleries.remove(id);
    return apiResponse({ deleted: true });
  }
}
