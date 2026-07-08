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
import { LikesService } from './likes.service';

/** Reader likes on articles. Any authenticated user may like a published story. */
@Controller('articles/:id/like')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Get()
  async status(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.likes.status(user.id, id));
  }

  @Post()
  @HttpCode(200)
  async like(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.likes.like(user.id, id));
  }

  @Delete()
  async unlike(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.likes.unlike(user.id, id));
  }
}
