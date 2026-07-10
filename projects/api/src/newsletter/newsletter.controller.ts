import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { SubscribeDto, UnsubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async subscribe(@Body() dto: SubscribeDto) {
    return apiResponse(await this.newsletter.subscribe(dto.email));
  }

  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    return apiResponse(await this.newsletter.unsubscribe(dto.token));
  }

  @Get('subscribers/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async count() {
    return apiResponse(await this.newsletter.activeCount());
  }
}
