import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Transactional email. No SMTP transport is wired yet (documents/00 §8 lists
 * SMTP as infrastructure still to add), so for now the link is logged — dev and
 * staging flows work end-to-end. Swap `deliver` for a real transport
 * (e.g. nodemailer) once SMTP credentials exist; callers stay unchanged.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.deliver(email, 'Verify your Frame Africa email', link);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    await this.deliver(email, 'Reset your Frame Africa password', link);
  }

  /**
   * Deliver a freshly generated temporary password (admin-created or -reset
   * account). The recipient must change it at next sign-in.
   */
  async sendTemporaryPassword(email: string, temporaryPassword: string): Promise<void> {
    const link = `${this.appUrl}/login`;
    this.logger.log(
      `[mail] to=${email} subject="Your Frame Africa temporary password" ` +
        `password=${temporaryPassword} link=${link}`,
    );
    return Promise.resolve();
  }

  private deliver(to: string, subject: string, link: string): Promise<void> {
    this.logger.log(`[mail] to=${to} subject="${subject}" link=${link}`);
    return Promise.resolve();
  }
}
