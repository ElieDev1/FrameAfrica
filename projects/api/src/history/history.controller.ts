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
import { HistoryService } from './history.service';

/** The signed-in reader's reading history ("Recently read"). */
@Controller('me/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.history.list(user.id));
  }

  @Post(':articleId')
  @HttpCode(200)
  async record(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return apiResponse(await this.history.record(user.id, articleId));
  }

  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.history.clear(user.id));
  }
}
