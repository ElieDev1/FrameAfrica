import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import webpush, { type PushSubscription as WebPushSubscription } from 'web-push';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { PrismaService } from '../prisma/prisma.service';

/** What a browser hands us when a reader says yes to alerts. */
export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** The alert a reader actually sees on their lock screen. */
export interface Alert {
  title: string;
  body?: string;
  url: string;
  tag?: string;
}

interface Vapid {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** A push service says "this browser is gone" with one of these. */
const DEAD_SUBSCRIPTION = new Set([404, 410]);

/**
 * Breaking-news alerts, delivered to the browser even when the site is closed
 * (documents/14 §6, FR-READ-9).
 *
 * The keys live in Settings, like every other integration, so an admin can
 * generate them from the dashboard — `generateKeys()` — rather than hand-editing
 * an env file. Until they exist, subscribing is refused cleanly and the site
 * simply doesn't offer the toggle.
 *
 * A subscription belongs to a *browser*, not an account: `userId` is null for a
 * reader who never signed in, and the same reader on a phone and a laptop is two
 * subscriptions. The endpoint is the identity, so re-subscribing updates the row
 * instead of fanning out duplicate alerts.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AdminSettingsService,
  ) {}

  /** The key a browser needs to subscribe. Null when push is not configured. */
  async publicKey(): Promise<string | null> {
    return this.settings.getValue('VAPID_PUBLIC_KEY');
  }

  /**
   * Mint a VAPID pair and store it. Admin-only: it rotates the identity we push
   * under, which invalidates every existing subscription, so it refuses to
   * clobber an existing pair unless explicitly told to.
   */
  async generateKeys(force = false): Promise<{ publicKey: string; rotated: boolean }> {
    const existing = await this.settings.getValue('VAPID_PUBLIC_KEY');
    if (existing && !force) {
      return { publicKey: existing, rotated: false };
    }

    const keys = webpush.generateVAPIDKeys();
    await this.settings.setIntegration('VAPID_PUBLIC_KEY', keys.publicKey);
    await this.settings.setIntegration('VAPID_PRIVATE_KEY', keys.privateKey);

    if (existing) {
      // The old identity is gone: every browser subscribed under it can no
      // longer be reached, so drop the rows rather than fail on each send.
      const { count } = await this.prisma.pushSubscription.deleteMany({});
      this.logger.warn(`VAPID keys rotated — ${count} existing subscriptions dropped`);
    }
    return { publicKey: keys.publicKey, rotated: Boolean(existing) };
  }

  /** Remember a browser. Re-subscribing the same browser updates it. */
  async subscribe(
    subscription: BrowserSubscription,
    userId: string | null,
    userAgent?: string,
  ): Promise<{ subscribed: true }> {
    await this.vapid(); // refuse before storing anything we could never send to

    const data = {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
      userAgent: userAgent?.slice(0, 300) ?? null,
    };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: data,
      create: { endpoint: subscription.endpoint, ...data },
    });
    return { subscribed: true };
  }

  /** Forget a browser. Turning alerts off must always work, configured or not. */
  async unsubscribe(endpoint: string): Promise<{ removed: boolean }> {
    const { count } = await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { removed: count > 0 };
  }

  /** Whether this browser is already subscribed (the toggle's initial state). */
  async isSubscribed(endpoint: string): Promise<boolean> {
    const row = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true },
    });
    return Boolean(row);
  }

  /**
   * Send an alert to every subscribed browser. Returns what happened, because an
   * editor who pushed a breaking story deserves to know it went out.
   *
   * A browser that has revoked permission or cleared its data answers 404/410;
   * that row is deleted rather than retried forever.
   */
  async broadcast(alert: Alert): Promise<{ sent: number; failed: number; pruned: number }> {
    const vapid = await this.vapidOrNull();
    if (!vapid) return { sent: 0, failed: 0, pruned: 0 };

    const subscriptions = await this.prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) return { sent: 0, failed: 0, pruned: 0 };

    const payload = JSON.stringify(alert);
    const dead: string[] = [];
    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (row) => {
        const target: WebPushSubscription = {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        };
        try {
          await webpush.sendNotification(target, payload, {
            vapidDetails: {
              subject: vapid.subject,
              publicKey: vapid.publicKey,
              privateKey: vapid.privateKey,
            },
            TTL: 60 * 30, // a breaking headline is worthless a day later
          });
          sent += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status && DEAD_SUBSCRIPTION.has(status)) {
            dead.push(row.endpoint);
          } else {
            failed += 1;
            this.logger.warn(`Push failed (${status ?? 'no status'}) for ${row.endpoint}`);
          }
        }
      }),
    );

    if (dead.length > 0) {
      await this.prisma.pushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
    }
    if (sent > 0) {
      await this.prisma.pushSubscription.updateMany({
        where: { endpoint: { notIn: dead } },
        data: { lastSentAt: new Date() },
      });
    }

    this.logger.log(`Alert sent to ${sent} browsers (${failed} failed, ${dead.length} pruned)`);
    return { sent, failed, pruned: dead.length };
  }

  /** How many browsers we could reach right now — shown in the dashboard. */
  async count(): Promise<number> {
    return this.prisma.pushSubscription.count();
  }

  private async vapid(): Promise<Vapid> {
    const vapid = await this.vapidOrNull();
    if (!vapid) {
      throw new ServiceUnavailableException(
        'Breaking-news alerts are not configured yet. Generate the web-push keys in Settings.',
      );
    }
    return vapid;
  }

  private async vapidOrNull(): Promise<Vapid | null> {
    const [publicKey, privateKey, subject] = await Promise.all([
      this.settings.getValue('VAPID_PUBLIC_KEY'),
      this.settings.getValue('VAPID_PRIVATE_KEY'),
      this.settings.getValue('VAPID_SUBJECT'),
    ]);
    if (!publicKey || !privateKey) return null;

    // The push services require a contact; a sensible default beats refusing to
    // send because nobody filled in a mailto:.
    return { publicKey, privateKey, subject: subject ?? 'mailto:newsroom@frameafrica.rw' };
  }
}
