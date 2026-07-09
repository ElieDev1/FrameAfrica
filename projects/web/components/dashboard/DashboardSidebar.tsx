'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PanelLeftIcon } from '@/components/icons';
import { DashboardNav } from './DashboardNav';
import { Wordmark } from '../Wordmark';

const KEY = 'fa-dash-collapsed';

/** Desktop dashboard sidebar with a collapse (icons-only) / expand toggle. */
export function DashboardSidebar({ roles }: { roles: string[] }) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore the saved preference after mount (avoids a hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(KEY) === '1');
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-surface md:flex ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Fixed header — same height + border as the topbar, so they read as one
          continuous top strip. Does not scroll with the nav. */}
      <div
        className={`flex h-14 shrink-0 items-center border-b border-border ${
          collapsed ? 'justify-center px-2' : 'justify-between px-3'
        }`}
      >
        {!collapsed && (
          <Link href="/dashboard" className="px-1">
            <Wordmark size="sm" />
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted transition-colors hover:text-text"
        >
          <PanelLeftIcon size={16} />
        </button>
      </div>

      {/* Only the nav scrolls (silently). */}
      <div className={`no-scrollbar flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        <DashboardNav roles={roles} collapsed={collapsed} />
      </div>

      {!collapsed && (
        <p className="shrink-0 border-t border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Frame Africa · Newsroom
        </p>
      )}
    </aside>
  );
}
