import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationType, type TipStatus } from '@prisma/client';
import { stripText } from '../content/blocks';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface TipItem {
  id: string;
  message: string;
  contact: string | null;
  status: TipStatus;
  createdAt: string;
}

/**
 * Confidential news tips from the public (documents/14 §7). Tips are anonymous
 * unless the tipster volunteers a contact; message + contact are stripped of
 * markup on write. Only editors/admins read the inbox.
 */
@Injectable()
export class TipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(rawMessage: string, rawContact?: string): Promise<{ received: boolean }> {
    const message = stripText(rawMessage).slice(0, 5000);
    if (!message) {
      throw new BadRequestException('A tip message is required');
    }
    const contact = rawContact ? stripText(rawContact).slice(0, 200) || null : null;
    await this.prisma.tip.create({ data: { message, contact } });
    await this.notifications.notifyRoles(['editor', 'admin'], {
      type: NotificationType.tip_received,
      title: 'New confidential tip',
      body: message.slice(0, 160),
      link: '/dashboard/tips',
    });
    return { received: true };
  }

  async list(status?: TipStatus): Promise<TipItem[]> {
    const rows = await this.prisma.tip.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toItem);
  }

  async setStatus(id: string, status: TipStatus): Promise<TipItem> {
    const updated = await this.prisma.tip.update({ where: { id }, data: { status } });
    return toItem(updated);
  }
}

function toItem(row: {
  id: string;
  message: string;
  contact: string | null;
  status: TipStatus;
  createdAt: Date;
}): TipItem {
  return {
    id: row.id,
    message: row.message,
    contact: row.contact,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
