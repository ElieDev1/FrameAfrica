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
import { FollowsService } from './follows.service';

/** The signed-in reader's followed sections and topics. */
@Controller('me/follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.follows.list(user.id));
  }

  @Get(':target/:id')
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('target') target: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return apiResponse(await this.follows.status(user.id, FollowsService.parseTarget(target), id));
  }

  @Post(':target/:id')
  @HttpCode(200)
  async follow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('target') target: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return apiResponse(await this.follows.follow(user.id, FollowsService.parseTarget(target), id));
  }

  @Delete(':target/:id')
  async unfollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('target') target: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return apiResponse(
      await this.follows.unfollow(user.id, FollowsService.parseTarget(target), id),
    );
  }
}
