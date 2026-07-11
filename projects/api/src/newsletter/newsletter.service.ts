import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Newsletter subscriptions (documents/14 §6). Single opt-in for now
 * (`confirmedAt` is set on subscribe); each subscriber gets an `unsubscribeToken`
 * for one-click unsubscribe. Resubscribing clears the unsubscribed flag.
 * Delivery of the actual digest lands with an SMTP/queue worker.
 */
@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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
    await this.notifications.notifyRoles(['admin'], {
      type: NotificationType.subscriber_joined,
      title: 'New newsletter subscriber',
      body: email,
      link: '/dashboard/newsletter',
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

  /**
   * Compose + "send" a campaign to active subscribers. Records the campaign and
   * a recipient snapshot; the actual SMTP/queue delivery worker plugs in here
   * later (each recipient has an unsubscribe token ready).
   */
  async send(
    subject: string,
    body: string,
    senderId?: string,
  ): Promise<{ id: string; recipients: number }> {
    const recipients = await this.prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: null, confirmedAt: { not: null } },
    });
    const campaign = await this.prisma.newsletterCampaign.create({
      data: { subject, body, recipients, sentAt: new Date(), senderId: senderId ?? null },
      select: { id: true, recipients: true },
    });
    return campaign;
  }

  /** Recent campaigns for the admin newsletter page. */
  async campaigns(): Promise<
    { id: string; subject: string; recipients: number; sentAt: string | null; createdAt: string }[]
  > {
    const rows = await this.prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      recipients: r.recipients,
      sentAt: r.sentAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
