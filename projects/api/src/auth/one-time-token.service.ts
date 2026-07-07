import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserTokenType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Hash a high-entropy token for at-rest storage/lookup (never store the raw). */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Single-use, hashed, expiring tokens for email verification and password
 * reset (documents/05-Security-Design.md §3.1). The raw token is returned once
 * (to email); only its hash is persisted.
 */
@Injectable()
export class OneTimeTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mint a token of `type`; returns the raw value to deliver out-of-band. */
  async issue(userId: string, type: UserTokenType, ttlMs: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.prisma.userToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return token;
  }

  /**
   * Validate + consume a token, returning its `userId`. Marks it used so it
   * cannot be replayed. Throws on unknown, wrong-type, expired, or used tokens.
   */
  async consume(rawToken: string, type: UserTokenType): Promise<string> {
    const record = await this.prisma.userToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (
      !record ||
      record.type !== type ||
      record.usedAt !== null ||
      record.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record.userId;
  }

  /** Invalidate any outstanding tokens of a type (before issuing a fresh one). */
  async invalidateAll(userId: string, type: UserTokenType): Promise<void> {
    await this.prisma.userToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
