'use server';

import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface NotificationItem {
  id: string;
  type: 'article_published' | 'article_returned' | 'comment_reply';
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

async function authed(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

/** The signed-in user's notifications (newest first); [] when signed out. */
export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await authed('/me/notifications');
    if (!res?.ok) return [];
    const json = (await res.json()) as { data: NotificationItem[] };
    return json.data;
  } catch {
    return [];
  }
}

/** Unread notification count (0 when signed out or on error). */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await authed('/me/notifications/unread-count');
    if (!res?.ok) return 0;
    const json = (await res.json()) as { data: { count: number } };
    return json.data.count;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await authed(`/me/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authed('/me/notifications/read-all', { method: 'POST' });
}
