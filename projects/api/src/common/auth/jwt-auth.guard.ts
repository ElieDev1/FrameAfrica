import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../../auth/token.service';
import type { AuthenticatedRequest } from './authenticated-user';

/**
 * Authenticates a request from a `Authorization: Bearer <access JWT>` header and
 * attaches `{ id, roles }` to the request. Deny-by-default (documents/05 §4).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const claims = await this.tokens.verifyAccessToken(header.slice(7));
      req.user = { id: claims.sub, roles: claims.roles };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
