import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { CommentsService } from './comments.service';
import { ModerateCommentDto } from './dto/moderate-comment.dto';

/** Comment moderation — moderators & admins only. */
@Controller('cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.moderator, RoleName.editor, RoleName.admin)
export class CommentModerationController {
  constructor(private readonly comments: CommentsService) {}

  @Get('moderation')
  async queue() {
    return apiResponse(await this.comments.listFlagged());
  }

  @Post('comments/:id/moderate')
  @HttpCode(200)
  async moderate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModerateCommentDto) {
    return apiResponse(await this.comments.moderate(id, dto.action));
  }

  @Delete('comments/:id')
  @HttpCode(200)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.comments.softDelete(id));
  }

  @Post('users/:id/ban')
  @HttpCode(200)
  async ban(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.comments.banUser(id));
  }

  @Post('users/:id/unban')
  @HttpCode(200)
  async unban(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.comments.unbanUser(id));
  }
}
