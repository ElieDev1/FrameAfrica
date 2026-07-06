import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { AuthResult } from './auth.types';

const authResult: AuthResult = {
  user: {
    id: 'u1',
    email: 'reader@frameafrica.rw',
    displayName: 'Reader One',
    avatarUrl: null,
    roles: ['reader'],
  },
  accessToken: 'access.jwt',
  refreshToken: 'refresh-raw',
  refreshExpiresAt: new Date('2026-02-01T00:00:00Z'),
};

function build() {
  const auth = {
    register: jest.fn().mockResolvedValue(authResult),
    login: jest.fn().mockResolvedValue(authResult),
    refresh: jest.fn().mockResolvedValue(authResult),
    logout: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: () => 'false' } as unknown as ConfigService;
  const controller = new AuthController(auth as unknown as AuthService, config);
  const cookie = jest.fn();
  const clearCookie = jest.fn();
  const res = { cookie, clearCookie } as unknown as Response;
  return { controller, auth, res, cookie, clearCookie };
}

const reqWith = (cookies: Record<string, string>) => ({ cookies }) as unknown as Request;

describe('AuthController', () => {
  it('register sets an httpOnly refresh cookie and returns user + access token', async () => {
    const { controller, res, cookie } = build();

    const out = await controller.register(
      { email: 'reader@frameafrica.rw', password: 'pw12345', displayName: 'Reader One' },
      res,
    );

    expect(out.data).toEqual({ user: authResult.user, accessToken: 'access.jwt' });
    expect(cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-raw',
      expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/v1/auth' }),
    );
  });

  it('refresh rejects when the cookie is absent', async () => {
    const { controller, res } = build();
    await expect(controller.refresh(reqWith({}), res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh rotates using the cookie value', async () => {
    const { controller, auth, res } = build();
    await controller.refresh(reqWith({ refresh_token: 'old-refresh' }), res);
    expect(auth.refresh).toHaveBeenCalledWith('old-refresh');
  });

  it('logout revokes the token and clears the cookie', async () => {
    const { controller, auth, res, clearCookie } = build();
    await controller.logout(reqWith({ refresh_token: 'r' }), res);
    expect(auth.logout).toHaveBeenCalledWith('r');
    expect(clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/v1/auth' });
  });
});
