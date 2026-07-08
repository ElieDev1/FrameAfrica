import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateDraftDto } from './dto/update-draft.dto';

/**
 * Admin newsroom: edit ANY article regardless of author or status (documents/07
 * UC-ADMIN — "admin can edit available news"). Object-level ownership does not
 * apply here; the admin role is the authorisation.
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
}

function isStatus(value?: string): value is ArticleStatus {
  return !!value && (Object.values(ArticleStatus) as string[]).includes(value);
}
