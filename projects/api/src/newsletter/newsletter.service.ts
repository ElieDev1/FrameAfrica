import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Newsletter subscriptions (documents/14 §6). Single opt-in for now
 * (`confirmedAt` is set on subscribe); each subscriber gets an `unsubscribeToken`
 * for one-click unsubscribe. Resubscribing clears the unsubscribed flag.
 * Delivery of the actual digest lands with an SMTP/queue worker.
 */
@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(rawEmail: string): Promise<{ subscribed: boolean }> {
    const email = rawEmail.trim().toLowerCase();
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.unsubscribedAt) {
        await this.prisma.newsletterSubscriber.update({
          where: { email },
          data: { unsubscribedAt: null, confirmedAt: existing.confirmedAt ?? new Date() },
        });
      }
      return { subscribed: true };
    }
    await this.prisma.newsletterSubscriber.create({
      data: {
        email,
        confirmedAt: new Date(),
        unsubscribeToken: randomBytes(24).toString('hex'),
      },
    });
    return { subscribed: true };
  }

  async unsubscribe(token: string): Promise<{ unsubscribed: boolean }> {
    const { count } = await this.prisma.newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    return { unsubscribed: count > 0 };
  }

  /** Active-subscriber count (editor/admin). */
  async activeCount(): Promise<{ count: number }> {
    const count = await this.prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: null, confirmedAt: { not: null } },
    });
    return { count };
  }
}
