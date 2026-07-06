import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from './authenticated-user';

/** Injects the authenticated user attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user;
  },
);
