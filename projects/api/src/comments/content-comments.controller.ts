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
import { Throttle } from '@nestjs/throttler';
import { EngagementTarget } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { ParseTargetPipe } from '../engagement/parse-target.pipe';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

/**
 * Comments on any content type:
 * `/comments/{article|gallery|episode|interactive|video}/{id}`.
 * The article-specific routes remain for backwards compatibility.
 */
@Controller('comments/:type/:id')
export class ContentCommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** Public: visible comments, threaded. */
  @Get()
  async list(
    @Param('type', ParseTargetPipe) type: EngagementTarget,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return apiResponse(await this.comments.listFor(type, id));
  }

  /** Signed-in readers post a comment (5/min/user, as for articles). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(201)
  async create(
    @Param('type', ParseTargetPipe) type: EngagementTarget,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return apiResponse(await this.comments.createFor(user.id, type, id, dto));
  }
}
