'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, LogOutIcon, MenuIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import { logout } from '@/lib/auth-actions';
import { DashboardNav } from './DashboardNav';
import { NotificationsBell } from './NotificationsBell';
import { ThemeToggle } from '../ThemeToggle';
import { Wordmark } from '../Wordmark';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function DashboardTopbar({
  name,
  role,
  roles,
}: {
  name: string;
  role: string;
  roles: string[];
}) {
  const pathname = usePathname();
  const t = useT();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = roles.includes('admin');

  // Close the mobile drawer + menu whenever the route changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close the profile menu on outside click / Escape.
  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
      {/* Mobile: menu toggle + brand */}
      <button
        type="button"
        onClick={() => setDrawer(true)}
        aria-label={t('dash.openMenu')}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted hover:text-text md:hidden"
      >
        <MenuIcon size={18} />
      </button>
      <Link href="/dashboard" className="md:hidden">
        <Wordmark size="sm" />
      </Link>

      {/* Search (admin: all articles) */}
      {isAdmin && (
        <form action="/dashboard/articles" className="relative hidden max-w-sm flex-1 md:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <SearchIcon size={16} />
          </span>
          <input
            name="q"
            type="search"
            placeholder={t('dash.searchArticles')}
            className="w-full rounded-lg border border-border bg-bg py-1.5 pl-9 pr-3 font-body text-sm text-text outline-none focus:border-primary"
          />
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/dashboard/stories/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={15} /> <span className="hidden sm:inline">{t('dash.newStory')}</span>
        </Link>
        <ThemeToggle />

        {/* Notifications */}
        <NotificationsBell />

        {/* Profile menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 hover:border-primary"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-heading text-xs font-bold text-primary">
              {initials(name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block font-body text-xs font-semibold leading-tight text-text">
                {name.split(' ')[0]}
              </span>
              <span className="block font-mono text-[9px] uppercase leading-tight tracking-[0.12em] text-primary">
                {role}
              </span>
            </span>
          </button>
          {menu && (
            <div
              role="menu"
              className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate font-body text-sm font-semibold text-text">{name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                  {role}
                </p>
              </div>
              <Link
                href="/account"
                role="menuitem"
                onClick={() => setMenu(false)}
                className="block px-3 py-2 font-body text-sm text-text hover:bg-surface-2"
              >
                {t('dash.myAccount')}
              </Link>
              <Link
                href="/"
                role="menuitem"
                onClick={() => setMenu(false)}
                className="block px-3 py-2 font-body text-sm text-text hover:bg-surface-2"
              >
                {t('dash.viewSite')}
              </Link>
              <form action={logout} className="border-t border-border">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm text-accent-red hover:bg-accent-red/10"
                >
                  <LogOutIcon size={15} /> {t('dash.signOut')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer — portalled to body so the topbar's backdrop-blur
          (which becomes a containing block for fixed children) can't clip it. */}
      {drawer &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
            <div className="no-scrollbar absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <Link href="/dashboard">
                  <Wordmark size="sm" />
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label={t('dash.closeMenu')}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-text"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
              <DashboardNav roles={roles} />
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
