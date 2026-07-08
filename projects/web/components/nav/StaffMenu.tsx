'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { staffNav } from '@/lib/staff-nav';

/**
 * Desktop newsroom dropdown for signed-in staff — gives one-click access to the
 * dashboard tools from anywhere on the public site, not only inside /dashboard.
 */
export function StaffMenu({ isEditor, isAdmin }: { isEditor: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groups = staffNav({ isEditor, isAdmin });

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-primary"
      >
        Newsroom{' '}
        <span aria-hidden className="text-[9px]">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          {groups.map((group) => (
            <div key={group.section} className="border-b border-border/60 py-1.5 last:border-0">
              <p className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                {group.section}
              </p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-1.5 font-body text-sm text-text hover:bg-surface-2 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
