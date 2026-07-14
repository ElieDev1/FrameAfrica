import { Body, Controller, Get, Headers, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName } from '@prisma/client';
import { TokenService } from '../auth/token.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { SubscribeDto, UnsubscribeDto } from './dto/push.dto';
import { PushService } from './push.service';

/**
 * Breaking-news alerts. Subscribing is open to anyone — an alert is a promise to
 * a browser, and a reader should not need an account to be told the news. When
 * a bearer token happens to be present the subscription is tied to that account
 * too, so deleting the account takes its alerts with it.
 */
@Controller('push')
export class PushController {
  constructor(
    private readonly push: PushService,
    private readonly tokens: TokenService,
  ) {}

  /** Never rejects: an anonymous reader is a perfectly normal reader. */
  private async optionalUserId(authorization?: string): Promise<string | null> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return null;
    try {
      return (await this.tokens.verifyAccessToken(token)).sub;
    } catch {
      return null;
    }
  }

  /** The key a browser needs to subscribe. `null` means push is not set up. */
  @Get('key')
  async key() {
    return apiResponse({ publicKey: await this.push.publicKey() });
  }

  /** Is this browser already subscribed? Drives the toggle's initial state. */
  @Get('status')
  async status(@Query('endpoint') endpoint?: string) {
    const configured = Boolean(await this.push.publicKey());
    const subscribed = endpoint ? await this.push.isSubscribed(endpoint) : false;
    return apiResponse({ configured, subscribed });
  }

  @Post('subscribe')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async subscribe(
    @Body() dto: SubscribeDto,
    @Headers('authorization') authorization?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const userId = await this.optionalUserId(authorization);
    return apiResponse(await this.push.subscribe(dto, userId, userAgent));
  }

  /** Turning alerts off must always work — even if push was later switched off. */
  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    return apiResponse(await this.push.unsubscribe(dto.endpoint));
  }
}

/** Admin: mint the VAPID pair, and see how many browsers we can reach. */
@Controller('admin/push')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class PushAdminController {
  constructor(private readonly push: PushService) {}

  @Get()
  async overview() {
    return apiResponse({
      configured: Boolean(await this.push.publicKey()),
      subscribers: await this.push.count(),
    });
  }

  /**
   * Generating a *new* pair while one exists rotates the identity we push under
   * and orphans every existing subscription — so it only happens on an explicit
   * `?force=true`.
   */
  @Post('keys')
  @HttpCode(200)
  async keys(@Query('force') force?: string) {
    return apiResponse(await this.push.generateKeys(force === 'true'));
  }
}
