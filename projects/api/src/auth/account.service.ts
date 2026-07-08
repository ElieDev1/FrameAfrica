import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserTokenType } from '@prisma/client';
import { MailerService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { OneTimeTokenService } from './one-time-token.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const DEFAULT_VERIFY_TTL_SECONDS = 24 * 60 * 60; // 24h
const DEFAULT_RESET_TTL_SECONDS = 60 * 60; // 1h

/**
 * Email verification + password reset (documents/04 §4, `FR-AUTH-1`, `-5`).
 * Both are token-based email flows sharing OneTimeTokenService + MailerService.
 */
@Injectable()
export class AccountService {
  private readonly verifyTtlMs: number;
  private readonly resetTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly oneTime: OneTimeTokenService,
    private readonly mailer: MailerService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    config: ConfigService,
  ) {
    this.verifyTtlMs =
      Number(config.get<string>('EMAIL_VERIFICATION_TTL', String(DEFAULT_VERIFY_TTL_SECONDS))) *
      1000;
    this.resetTtlMs =
      Number(config.get<string>('PASSWORD_RESET_TTL', String(DEFAULT_RESET_TTL_SECONDS))) * 1000;
  }

  /** Issue a fresh verification token and email it (register + resend). */
  async sendVerification(userId: string, email: string): Promise<void> {
    await this.oneTime.invalidateAll(userId, UserTokenType.email_verification);
    const token = await this.oneTime.issue(
      userId,
      UserTokenType.email_verification,
      this.verifyTtlMs,
    );
    await this.mailer.sendEmailVerification(email, token);
  }

  /** Confirm an email-verification token → stamp `emailVerifiedAt`. */
  async verifyEmail(rawToken: string): Promise<void> {
    const userId = await this.oneTime.consume(rawToken, UserTokenType.email_verification);
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  /**
   * Begin a password reset. Resolves the same whether or not the email exists,
   * so it can't be used to enumerate accounts (documents/05 §3.4).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return;
    await this.oneTime.invalidateAll(user.id, UserTokenType.password_reset);
    const token = await this.oneTime.issue(user.id, UserTokenType.password_reset, this.resetTtlMs);
    await this.mailer.sendPasswordReset(user.email, token);
  }

  /** Complete a reset: set the new password and revoke every live session. */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const userId = await this.oneTime.consume(rawToken, UserTokenType.password_reset);
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // A reset invalidates existing sessions — force re-login everywhere.
    await this.tokens.revokeAllForUser(userId);
  }

  /**
   * First-login password change: a user on a generated password (admin-created
   * or admin-reset) sets their own password with no email token — they are
   * already authenticated. Clears the `mustChangePassword` flag.
   */
  async setInitialPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }
}
