import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { CommentsService } from './comments.service';
import { ReportCommentDto } from './dto/report-comment.dto';

/** Reader actions on a comment: like / unlike / report. */
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentActionsController {
  constructor(private readonly comments: CommentsService) {}

  @Post(':id/like')
  @HttpCode(200)
  async like(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.comments.like(user.id, id));
  }

  @Delete(':id/like')
  async unlike(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.comments.unlike(user.id, id));
  }

  @Post(':id/report')
  @HttpCode(200)
  async report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportCommentDto,
  ) {
    return apiResponse(await this.comments.report(user.id, id, dto.reason));
  }
}
