import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface AccessClaims {
  sub: string;
  roles: string[];
}

export interface IssuedRefreshToken {
  token: string;
  familyId: string;
  expiresAt: Date;
}

const DEFAULT_ACCESS_TTL = 900; // 15 min
const DEFAULT_REFRESH_TTL = 1_209_600; // 14 days

/** Hash a high-entropy refresh token for at-rest storage/lookup. */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Signs short-lived access JWTs and manages long-lived refresh tokens with
 * rotation + reuse detection (documents/05-Security-Design.md §3.2).
 */
@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // No fallback: a missing secret must fail startup, not sign tokens with a
    // value anyone can read in this file.
    this.accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessTtlSeconds = Number(
      this.config.get<string>('JWT_ACCESS_TTL', String(DEFAULT_ACCESS_TTL)),
    );
    this.refreshTtlMs =
      Number(this.config.get<string>('JWT_REFRESH_TTL', String(DEFAULT_REFRESH_TTL))) * 1000;
  }

  signAccessToken(claims: AccessClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSeconds,
    });
  }

  verifyAccessToken(token: string): Promise<AccessClaims> {
    return this.jwt.verifyAsync<AccessClaims>(token, { secret: this.accessSecret });
  }

  /** Mint a refresh token, optionally continuing an existing rotation family. */
  async issueRefreshToken(userId: string, familyId?: string): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('hex');
    const family = familyId ?? randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(token), familyId: family, expiresAt },
    });

    return { token, familyId: family, expiresAt };
  }

  /**
   * Validate + rotate a refresh token. Presenting an unknown, expired, or
   * already-rotated token is treated as compromise: the whole family is revoked.
   */
  async rotateRefreshToken(rawToken: string): Promise<{ userId: string } & IssuedRefreshToken> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt !== null || existing.expiresAt <= new Date()) {
      // Reuse of a rotated/expired token → revoke the entire lineage.
      await this.revokeFamily(existing.familyId);
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    const next = await this.issueRefreshToken(existing.userId, existing.familyId);

    return { userId: existing.userId, ...next };
  }

  /** Revoke every live token in a family (used on logout and on reuse detection). */
  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke a single presented refresh token (logout of one session). */
  async revokeToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
