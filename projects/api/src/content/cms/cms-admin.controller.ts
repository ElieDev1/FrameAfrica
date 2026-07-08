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
import { ArticleStatus, RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { apiResponse } from '../../common/http/api-response';
import { CmsDraftService } from './cms-draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

/**
 * Admin newsroom — full CRUD over ANY article regardless of author or status
 * (documents/07 UC-ADMIN). Unlike the journalist/editor flows, the admin isn't
 * bound by object ownership or the review workflow: create-and-publish, edit,
 * publish/unpublish/archive, soft-delete and restore are all direct.
 */
@Controller('cms/admin/articles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class CmsAdminController {
  constructor(private readonly drafts: CmsDraftService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('q') q?: string) {
    return apiResponse(
      await this.drafts.listAll({
        status: isStatus(status) ? status : undefined,
        q: q?.trim() || undefined,
      }),
    );
  }

  @Get('trash')
  async trash() {
    return apiResponse(await this.drafts.listDeleted());
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDraftDto,
    @Query('publish') publish?: string,
  ) {
    return apiResponse(await this.drafts.createAsAdmin(user.id, dto, publish === 'true'));
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.getAny(id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return apiResponse(await this.drafts.updateAny(user.id, id, dto));
  }

  @Post(':id/publish')
  @HttpCode(200)
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.setStatusAny(id, 'publish'));
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  async unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.setStatusAny(id, 'unpublish'));
  }

  @Post(':id/archive')
  @HttpCode(200)
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.setStatusAny(id, 'archive'));
  }

  @Post(':id/restore')
  @HttpCode(200)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.restoreAny(id));
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.deleteAny(id));
  }
}

function isStatus(value?: string): value is ArticleStatus {
  return !!value && (Object.values(ArticleStatus) as string[]).includes(value);
}
