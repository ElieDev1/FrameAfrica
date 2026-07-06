import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { apiResponse } from '../../common/http/api-response';
import { CmsDraftService } from './cms-draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

/** Newsroom draft endpoints. Staff-only; each caller sees only their own drafts. */
@Controller('cms/articles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.journalist, RoleName.editor, RoleName.admin)
export class CmsController {
  constructor(private readonly drafts: CmsDraftService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDraftDto) {
    return apiResponse(await this.drafts.createDraft(user.id, dto));
  }

  @Get()
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.drafts.listMyDrafts(user.id));
  }

  @Get(':id')
  async getOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.getMyDraft(user.id, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return apiResponse(await this.drafts.updateDraft(user.id, id, dto));
  }

  @Post(':id/submit')
  @HttpCode(200)
  async submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.submitDraft(user.id, id));
  }
}
