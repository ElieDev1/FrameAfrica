import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { generateTotpSecret, totpKeyuri, verifyTotp } from './totp';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/**
 * TOTP two-factor auth (documents/05 §3.3, `FR-AUTH-6`). The secret is stored on
 * the user; `twoFactorEnabled` only flips true once the user proves they can
 * produce a valid code, so a half-finished setup never locks anyone out.
 */
@Injectable()
export class TwoFactorService {
  private readonly issuer: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.issuer = config.get<string>('TOTP_ISSUER', 'Frame Africa');
  }

  /** Generate (or regenerate) a pending secret and return provisioning data. */
  async beginSetup(userId: string): Promise<TwoFactorSetup> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: userId },
      // Store the pending secret but keep 2FA disabled until confirmed.
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });
    const otpauthUrl = totpKeyuri(user.email, this.issuer, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrDataUrl };
  }

  /** Confirm a code against the pending secret and enable 2FA. */
  async enable(userId: string, token: string): Promise<{ enabled: true }> {
    const user = await this.load(userId);
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Start 2FA setup first');
    }
    if (!this.verify(user.twoFactorSecret, token)) {
      throw new BadRequestException('That code is not valid — try again');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return { enabled: true };
  }

  /** Turn 2FA off (requires a current code to prove possession). */
  async disable(userId: string, token: string): Promise<{ enabled: false }> {
    const user = await this.load(userId);
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { enabled: false };
    }
    if (!this.verify(user.twoFactorSecret, token)) {
      throw new BadRequestException('That code is not valid — try again');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { enabled: false };
  }

  /** Verify a TOTP code against a secret (small window for clock drift). */
  verify(secret: string, token: string): boolean {
    return verifyTotp(secret, token);
  }

  private async load(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
