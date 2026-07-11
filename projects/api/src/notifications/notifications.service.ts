import { Injectable, Logger } from '@nestjs/common';
import { type Prisma, type RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNotification, NotificationItem } from './notifications.types';

const LIST_LIMIT = 30;

/**
 * In-app notifications (documents/14 §6.3). Other services `create()` them on
 * newsroom events; the owner reads them via the dashboard bell. Creation is
 * best-effort — it never throws into the caller, so emitting a notification can
 * never break the action that triggered it (e.g. publishing a story).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotification): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          link: input.link ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to create notification: ${(error as Error).message}`);
    }
  }

  /**
   * Fan a single notification out to every active user holding one of the given
   * roles. Used for "we received X" staff alerts (inquiries, tips, new
   * subscribers, reported comments) so the right desk sees inbound activity in
   * the bell. Best-effort — never throws into the caller.
   */
  async notifyRoles(
    roles: readonly RoleName[],
    input: Omit<CreateNotification, 'userId'>,
  ): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          status: UserStatus.active,
          deletedAt: null,
          roles: { some: { role: { name: { in: [...roles] } } } },
        },
        select: { id: true },
      });
      if (users.length === 0) return;
      await this.prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          link: input.link ?? null,
        })),
      });
    } catch (error) {
      this.logger.warn(`Failed to fan out notification: ${(error as Error).message}`);
    }
  }

  async list(userId: string, limit = LIST_LIMIT): Promise<NotificationItem[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toItem);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string): Promise<{ read: boolean }> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async markAllRead(userId: string): Promise<{ marked: number }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: count };
  }
}

function toItem(row: Prisma.NotificationGetPayload<object>): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}
