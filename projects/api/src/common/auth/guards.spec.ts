import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { TokenService } from '../../auth/token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function contextFor(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const build = () => {
    const verifyAccessToken = jest.fn();
    const guard = new JwtAuthGuard({ verifyAccessToken } as unknown as TokenService);
    return { guard, verifyAccessToken };
  };

  it('rejects a request without a bearer token', async () => {
    const { guard } = build();
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the user for a valid token', async () => {
    const { guard, verifyAccessToken } = build();
    verifyAccessToken.mockResolvedValue({ sub: 'u1', roles: ['reader'] });
    const req: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer good.jwt' },
    };

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);
    expect(req.user).toEqual({ id: 'u1', roles: ['reader'] });
  });

  it('rejects an invalid token', async () => {
    const { guard, verifyAccessToken } = build();
    verifyAccessToken.mockRejectedValue(new Error('bad'));
    await expect(
      guard.canActivate(contextFor({ headers: { authorization: 'Bearer nope' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('RolesGuard', () => {
  const build = () => {
    const getAllAndOverride = jest.fn();
    const guard = new RolesGuard({ getAllAndOverride } as unknown as Reflector);
    return { guard, getAllAndOverride };
  };

  it('allows routes with no @Roles metadata', () => {
    const { guard, getAllAndOverride } = build();
    getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ user: { roles: [] } }))).toBe(true);
  });

  it('allows a user holding a required role', () => {
    const { guard, getAllAndOverride } = build();
    getAllAndOverride.mockReturnValue(['editor']);
    expect(guard.canActivate(contextFor({ user: { roles: ['editor'] } }))).toBe(true);
  });

  it('forbids a user missing every required role', () => {
    const { guard, getAllAndOverride } = build();
    getAllAndOverride.mockReturnValue(['editor']);
    expect(() => guard.canActivate(contextFor({ user: { roles: ['reader'] } }))).toThrow(
      ForbiddenException,
    );
  });
});
