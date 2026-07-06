import type { Request } from 'express';

/** The minimal identity attached to a request by JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  roles: string[];
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
