import { Body, Controller, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { apiResponse } from '../common/http/api-response';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const REFRESH_COOKIE = 'refresh_token';
// Scope the cookie to the auth routes so it isn't sent on every API call.
const REFRESH_COOKIE_PATH = '/v1/auth';

@Controller('auth')
export class AuthController {
  private readonly cookieSecure: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.cookieSecure = config.get<string>('COOKIE_SECURE', 'true') !== 'false';
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.session(await this.auth.register(dto), res);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.session(await this.auth.login(dto), res);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.readRefreshCookie(req);
    return this.session(await this.auth.refresh(token), res);
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
