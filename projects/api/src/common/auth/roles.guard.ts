import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@prisma/client';
import type { AuthenticatedRequest } from './authenticated-user';
import { ROLES_KEY } from './roles.decorator';

/**
 * Enforces `@Roles(...)` metadata. Runs after JwtAuthGuard, so the request
 * already carries the authenticated user. Routes without `@Roles` pass through.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = req.user?.roles ?? [];
    if (!required.some((role) => roles.includes(role))) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
