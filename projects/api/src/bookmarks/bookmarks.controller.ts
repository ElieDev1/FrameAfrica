import {
  Controller,
  Delete,
  Get,
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
import { BookmarksService } from './bookmarks.service';

/** The signed-in reader's saved articles. */
@Controller('me/bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.bookmarks.listSaved(user.id));
  }

  @Get(':articleId')
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return apiResponse(await this.bookmarks.status(user.id, articleId));
  }

  @Post(':articleId')
  @HttpCode(200)
  async save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return apiResponse(await this.bookmarks.save(user.id, articleId));
  }

  @Delete(':articleId')
  async unsave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return apiResponse(await this.bookmarks.unsave(user.id, articleId));
  }
}
