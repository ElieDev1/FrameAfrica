import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { SendCampaignDto } from './dto/send-campaign.dto';
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

  /** Compose + send a newsletter to active subscribers (records the campaign). */
  @Post('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendCampaignDto) {
    return apiResponse(await this.newsletter.send(dto.subject, dto.body, user.id));
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin)
  async campaigns() {
    return apiResponse(await this.newsletter.campaigns());
  }
}
