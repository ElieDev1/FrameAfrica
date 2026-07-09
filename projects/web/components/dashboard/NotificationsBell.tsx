'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BellIcon } from '@/components/icons';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/notifications-actions';

function timeAgo(iso: string): string {
  const secs = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Dashboard notifications bell backed by the real `/me/notifications` API. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll the unread count (cheap) so the badge stays fresh.
  useEffect(() => {
    let active = true;
    const load = () => fetchUnreadCount().then((n) => active && setUnread(n));
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const openPanel = useCallback(async () => {
    setOpen((o) => !o);
    if (open) return;
    setLoading(true);
    const list = await fetchNotifications();
    setItems(list);
    setLoading(false);
  }, [open]);

  async function onMarkAll() {
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
  }

  async function onOpenItem(item: NotificationItem) {
    if (!item.read) {
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
      setUnread((n) => Math.max(0, n - 1));
      await markNotificationRead(item.id);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={openPanel}
        aria-expanded={open}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:text-text"
      >
        <BellIcon size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-accent-red px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="font-heading text-sm font-bold text-text">Notifications</span>
            {items.some((i) => !i.read) && (
              <button
                type="button"
                onClick={onMarkAll}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-8 text-center font-body text-sm text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="font-body text-sm text-muted">You&apos;re all caught up.</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  New activity will appear here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const inner = (
                    <>
                      <span className="flex items-center gap-2">
                        {!item.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                        <span
                          className={`text-sm ${item.read ? 'text-muted' : 'font-semibold text-text'}`}
                        >
                          {item.title}
                        </span>
                      </span>
                      {item.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted">
                          {item.body}
                        </span>
                      )}
                      <span className="mt-1 block font-mono text-[10px] text-faint">
                        {timeAgo(item.createdAt)}
                      </span>
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => onOpenItem(item)}
                          className="block px-3 py-2.5 transition-colors hover:bg-surface-2"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenItem(item)}
                          className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
