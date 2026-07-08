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
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { apiResponse } from '../../common/http/api-response';
import { CmsEditorService } from './cms-editor.service';
import { AddCorrectionDto } from './dto/add-correction.dto';

/** Editor-only review queue + publish/reject. */
@Controller('cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.editor, RoleName.admin)
export class CmsEditorController {
  constructor(private readonly editor: CmsEditorService) {}

  @Get('review')
  async reviewQueue() {
    return apiResponse(await this.editor.listReviewQueue());
  }

  @Post('articles/:id/publish')
  @HttpCode(200)
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.editor.publish(id));
  }

  @Post('articles/:id/reject')
  @HttpCode(200)
  async reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectDto) {
    return apiResponse(await this.editor.reject(id, dto.note));
  }

  @Post('articles/:id/corrections')
  async addCorrection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCorrectionDto,
  ) {
    return apiResponse(await this.editor.addCorrection(id, user.id, dto.note));
  }

  @Post('articles/:id/corrections')
  async addCorrection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCorrectionDto,
  ) {
    return apiResponse(await this.editor.addCorrection(id, user.id, dto.note));
  }
}
