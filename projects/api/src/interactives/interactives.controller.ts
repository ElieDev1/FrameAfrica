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
import { pagination, readPaging } from '../common/http/paging';
import { CreateInteractiveDto, UpdateInteractiveDto } from './dto/interactive.dto';
import { InteractivesService } from './interactives.service';

@Controller()
export class InteractivesController {
  constructor(private readonly interactives: InteractivesService) {}

  @Get('interactives')
  async list(@Query('limit') limit?: string, @Query('page') page?: string, @Query('q') q?: string) {
    const paging = readPaging(limit, page, 24);
    const { items, hasMore } = await this.interactives.listPage(paging.limit, paging.page, q);
    return apiResponse(items, pagination(paging.page, hasMore));
  }

  @Get('interactives/:slug')
  async detail(@Param('slug') slug: string) {
    return apiResponse(await this.interactives.getBySlug(slug));
  }

  @Get('admin/interactives')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async listAll() {
    return apiResponse(await this.interactives.listAll());
  }

  @Get('admin/interactives/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.interactives.getById(id));
  }

  @Post('admin/interactives')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInteractiveDto) {
    return apiResponse(await this.interactives.create(user.id, dto));
  }

  @Patch('admin/interactives/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInteractiveDto) {
    return apiResponse(await this.interactives.update(id, dto));
  }

  @Delete('admin/interactives/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.interactives.remove(id);
    return apiResponse({ deleted: true });
  }
}
