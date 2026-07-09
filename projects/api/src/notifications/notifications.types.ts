import type { NotificationType } from '@prisma/client';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface CreateNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}
