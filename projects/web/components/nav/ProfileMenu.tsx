'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BookmarkIcon,
  ChevronDownIcon,
  CreditCardIcon,
  GridIcon,
  type IconProps,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from '@/components/icons';
import { logout } from '@/lib/auth-actions';
import { type Locale, type MessageKey, t } from '@/lib/i18n';
import type { NavUser } from './HeaderClient';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase() || 'FA';
}

function roleLabel(user: NavUser, locale: Locale): string {
  if (user.isAdmin) return t(locale, 'role.admin');
  if (user.isEditor) return t(locale, 'role.editor');
  if (user.isStaff) return t(locale, 'role.journalist');
  return t(locale, 'role.reader');
}

type Item = { href: string; labelKey: MessageKey; icon: (p: IconProps) => React.ReactNode };

/**
 * Signed-in profile menu: an avatar button that opens a dropdown with the
 * reader's quick links (For you, account, settings), the newsroom dashboard for
 * staff, and a sign-out action. Replaces the loose For-you/name/Newsroom links.
 */
export function ProfileMenu({ user, locale }: { user: NavUser; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: Item[] = [
    { href: '/for-you', labelKey: 'nav.forYou', icon: SparklesIcon },
    { href: '/account', labelKey: 'nav.myAccount', icon: UsersIcon },
    { href: '/account#saved', labelKey: 'nav.savedStories', icon: BookmarkIcon },
    { href: '/account/billing', labelKey: 'pay.billing', icon: CreditCardIcon },
    { href: '/account/security', labelKey: 'nav.accountSecurity', icon: SettingsIcon },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t(locale, 'dash.openMenu')}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
      >
        <Avatar user={user} />
        <ChevronDownIcon
          size={14}
          aria-hidden
          className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 border-b border-border bg-surface-2/50 px-3 py-3">
            <Avatar user={user} lg />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <span className="ml-auto shrink-0 self-start rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {roleLabel(user, locale)}
            </span>
          </div>

          <div className="py-1.5">
            {items.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={labelKey}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-text transition-colors hover:bg-surface-2 hover:text-primary"
              >
                <Icon size={16} className="text-muted" />
                {t(locale, labelKey)}
              </Link>
            ))}
          </div>

          {user.isStaff && (
            <div className="border-t border-border py-1.5">
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-2 hover:text-primary"
              >
                <GridIcon size={16} className="text-primary" />
                {t(locale, 'nav.newsroomDashboard')}
              </Link>
            </div>
          )}

          <div className="border-t border-border py-1.5">
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-accent-red/10 hover:text-accent-red"
              >
                <LogOutIcon size={16} className="text-muted" />
                {t(locale, 'nav.signOut')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, lg = false }: { user: NavUser; lg?: boolean }) {
  const size = lg ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs';
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar, arbitrary host
      <img
        src={user.avatarUrl}
        alt=""
        className={`${size} shrink-0 rounded-full object-cover ring-1 ring-border`}
      />
    );
  }
  return (
    <span
      className={`${size} grid shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary ring-1 ring-primary/20`}
    >
      {initials(user.name)}
    </span>
  );
}
