import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface Message {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  /** Primary call-to-action (a link button) — optional. */
  action?: { label: string; url: string };
  /** A code/secret rendered in a monospace box — optional. */
  code?: string;
  outro?: string;
}

/**
 * Transactional email. Uses a real SMTP transport when `SMTP_HOST` is
 * configured (documents/00 §8); otherwise it logs the message so dev/staging
 * flows still work end-to-end without credentials. Callers are unchanged.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly appUrl: string;
  private readonly from: string;
  private readonly transport: nodemailer.Transporter | null;

  constructor(config: ConfigService) {
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
    this.from = config.get<string>('MAIL_FROM', 'Frame Africa <no-reply@frameafrica.rw>');

    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transport = nodemailer.createTransport({
        host,
        port: Number(config.get<string>('SMTP_PORT', '587')),
        // Implicit TLS on 465; STARTTLS otherwise.
        secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: config.get<string>('SMTP_USER')
          ? {
              user: config.getOrThrow<string>('SMTP_USER'),
              pass: config.getOrThrow<string>('SMTP_PASS'),
            }
          : undefined,
      });
      this.logger.log(`SMTP transport configured (${host})`);
    } else {
      this.transport = null;
      this.logger.warn('No SMTP_HOST set — emails will be logged, not delivered.');
    }
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const url = `${this.appUrl}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your Frame Africa email',
      heading: 'Confirm your email',
      intro: 'Welcome to Frame Africa. Confirm this address to activate your account.',
      action: { label: 'Verify email', url },
      outro: "If you didn't create this account, you can ignore this email.",
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const url = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your Frame Africa password',
      heading: 'Reset your password',
      intro: 'We received a request to reset your password. This link expires soon.',
      action: { label: 'Choose a new password', url },
      outro: "If you didn't request this, no action is needed — your password is unchanged.",
    });
  }

  /**
   * Deliver a freshly generated temporary password (admin-created or -reset
   * account). The recipient must change it at next sign-in.
   */
  async sendTemporaryPassword(email: string, temporaryPassword: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Your Frame Africa temporary password',
      heading: 'Your temporary password',
      intro:
        'An administrator set up (or reset) your Frame Africa account. Sign in with the temporary password below — you will be asked to choose your own.',
      code: temporaryPassword,
      action: { label: 'Sign in', url: `${this.appUrl}/login` },
      outro: 'For your security, this password only works until you set a new one.',
    });
  }

  private async send(msg: Message): Promise<void> {
    const { text, html } = render(msg);
    if (!this.transport) {
      // Dev fallback: log enough to complete the flow locally.
      this.logger.log(
        `[mail] to=${msg.to} subject="${msg.subject}"` +
          (msg.action ? ` link=${msg.action.url}` : '') +
          (msg.code ? ` code=${msg.code}` : ''),
      );
      return;
    }
    try {
      await this.transport.sendMail({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send "${msg.subject}" to ${msg.to}`, error as Error);
      throw error;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Render a plain-text + minimal HTML pair for a message. */
function render(msg: Message): { text: string; html: string } {
  const lines = [msg.heading, '', msg.intro];
  if (msg.code) lines.push('', msg.code);
  if (msg.action) lines.push('', `${msg.action.label}: ${msg.action.url}`);
  if (msg.outro) lines.push('', msg.outro);
  const text = lines.join('\n');

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
  <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(msg.heading)}</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 16px">${escapeHtml(msg.intro)}</p>
  ${
    msg.code
      ? `<p style="font-family:ui-monospace,Menlo,monospace;font-size:18px;letter-spacing:1px;background:#f4f4f5;border-radius:8px;padding:12px 16px;margin:0 0 16px">${escapeHtml(
          msg.code,
        )}</p>`
      : ''
  }
  ${
    msg.action
      ? `<p style="margin:0 0 16px"><a href="${escapeHtml(
          msg.action.url,
        )}" style="display:inline-block;background:#e2231a;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px">${escapeHtml(
          msg.action.label,
        )}</a></p>`
      : ''
  }
  ${msg.outro ? `<p style="font-size:13px;color:#666;line-height:1.5;margin:0">${escapeHtml(msg.outro)}</p>` : ''}
</div>`;
  return { text, html };
}
