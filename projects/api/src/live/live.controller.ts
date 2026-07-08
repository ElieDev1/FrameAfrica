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
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AddLiveUpdateDto } from './dto/add-live-update.dto';
import { LiveService } from './live.service';

/** Live/developing coverage: a public update feed + staff posting controls. */
@Controller()
export class LiveController {
  constructor(private readonly live: LiveService) {}

  /** Public: the article's live updates, newest first. */
  @Get('articles/:slug/live')
  async list(@Param('slug') slug: string) {
    return apiResponse(await this.live.listUpdates(slug));
  }

  /** Staff: post a live update (marks the article live). */
  @Post('cms/articles/:id/live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.journalist, RoleName.sub_editor, RoleName.editor, RoleName.admin)
  async post(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddLiveUpdateDto,
  ) {
    return apiResponse(await this.live.addUpdate(id, user.id, dto));
  }

  /** Staff: end live coverage (the LIVE banner comes down; the log remains). */
  @Post('cms/articles/:id/live/end')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.journalist, RoleName.sub_editor, RoleName.editor, RoleName.admin)
  async end(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.live.endLive(id));
  }
}
