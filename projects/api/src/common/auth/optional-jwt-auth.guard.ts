import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { TokenService } from '../../auth/token.service';
import type { AuthenticatedRequest } from './authenticated-user';

/**
 * Attaches `{ id, roles }` when the request carries a valid bearer token, but
 * never rejects. Used by public endpoints that render *differently* for a
 * signed-in reader — e.g. engagement counts also reporting "you liked this".
 * A bad or expired token is treated exactly like no token: anonymous.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return true;

    try {
      const claims = await this.tokens.verifyAccessToken(header.slice(7));
      req.user = { id: claims.sub, roles: claims.roles };
    } catch {
      // Anonymous — deliberately not an error on a public route.
    }
    return true;
  }
}
