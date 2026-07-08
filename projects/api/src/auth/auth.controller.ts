import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.types';
import { TwoFactorService } from './two-factor.service';
import { FirstPasswordDto } from './dto/first-password.dto';
import { TwoFactorTokenDto } from './dto/two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const REFRESH_COOKIE = 'refresh_token';
// Scope the cookie to the auth routes so it isn't sent on every API call.
const REFRESH_COOKIE_PATH = '/v1/auth';

// documents/04-API-Design.md §10: "Auth attempts: 5 fails → temp lockout + backoff".
// This counts all requests (not just failures) per IP — a coarser but simpler
// mitigation than tracking failure counts; revisit if that distinction matters.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  private readonly cookieSecure: boolean;

  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
    private readonly twoFactor: TwoFactorService,
    config: ConfigService,
  ) {
    this.cookieSecure = config.get<string>('COOKIE_SECURE', 'true') !== 'false';
  }

  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.session(await this.auth.register(dto), res);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.session(await this.auth.login(dto), res);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.readRefreshCookie(req);
    return this.session(await this.auth.refresh(token), res);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.account.verifyEmail(dto.token);
    return apiResponse({ verified: true });
  }

  // Always 202 whether or not the email exists — no account enumeration (`05` §3.4).
  @Throttle(AUTH_THROTTLE)
  @Post('password/forgot')
  @HttpCode(202)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.account.requestPasswordReset(dto.email);
    return apiResponse({ requested: true });
  }

  @Throttle(AUTH_THROTTLE)
  @Post('password/reset')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.account.resetPassword(dto.token, dto.password);
    return apiResponse({ reset: true });
  }

  // First-login password change for a generated-password account. The caller
  // is already authenticated (they signed in with the temp password), so no
  // email token is required — just a valid access token.
  @UseGuards(JwtAuthGuard)
  @Post('password/first')
  @HttpCode(200)
  async firstPassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: FirstPasswordDto) {
    await this.account.setInitialPassword(user.id, dto.password);
    return apiResponse({ changed: true });
  }

  // ── Two-factor (TOTP) — all require an authenticated session ─────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(200)
  async twoFactorSetup(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.twoFactor.beginSetup(user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(200)
  async twoFactorEnable(@CurrentUser() user: AuthenticatedUser, @Body() dto: TwoFactorTokenDto) {
    return apiResponse(await this.twoFactor.enable(user.id, dto.token));
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(200)
  async twoFactorDisable(@CurrentUser() user: AuthenticatedUser, @Body() dto: TwoFactorTokenDto) {
    return apiResponse(await this.twoFactor.disable(user.id, dto.token));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = readCookie(req, REFRESH_COOKIE);
    if (token) {
      await this.auth.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  private session(result: AuthResult, res: Response) {
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return apiResponse({ user: result.user, accessToken: result.accessToken });
  }

  private readRefreshCookie(req: Request): string {
    const token = readCookie(req, REFRESH_COOKIE);
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return token;
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[name];
}
