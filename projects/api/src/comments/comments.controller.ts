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
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('articles/:articleId/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** Public: list visible comments for an article. */
  @Get()
  async list(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return apiResponse(await this.comments.listForArticle(articleId));
  }

  /** Signed-in readers post a comment (documents/04 §10: 5/min/user). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(201)
  async create(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return apiResponse(await this.comments.create(user.id, articleId, dto));
  }
}
