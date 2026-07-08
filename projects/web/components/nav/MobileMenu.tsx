'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CategoryNode } from '@/lib/api';

/**
 * Mobile navigation: a hamburger button that opens a full-height drawer with
 * search, the section tree (sub-sections expandable), and auth actions. Shown
 * only below the desktop breakpoint (`md:hidden`).
 */
export function MobileMenu({
  sections,
  signedIn,
  isStaff,
  isEditor,
  firstName,
}: {
  sections: CategoryNode[];
  signedIn: boolean;
  isStaff: boolean;
  isEditor: boolean;
  firstName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text"
      >
        <span aria-hidden className="text-lg leading-none">
          ☰
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-border bg-bg p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Menu</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text"
              >
                ✕
              </button>
            </div>

            <form action="/search" className="mt-4" onSubmit={close}>
              <input
                name="q"
                type="search"
                placeholder="Search…"
                aria-label="Search articles"
                className="w-full rounded-full border border-border bg-surface-2 px-4 py-2 font-body text-sm text-text outline-none focus:border-primary"
              />
            </form>

            <nav aria-label="Sections" className="mt-5 flex flex-col">
              {sections.map((section) => (
                <div key={section.id} className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/section/${section.slug}`}
                      onClick={close}
                      className="flex-1 py-3 font-heading text-base font-semibold text-text"
                    >
                      {section.name}
                    </Link>
                    {section.children.length > 0 && (
                      <button
                        type="button"
                        aria-label={`Toggle ${section.name} sub-sections`}
                        onClick={() =>
                          setExpanded((cur) => (cur === section.id ? null : section.id))
                        }
                        className="px-3 py-3 font-mono text-muted"
                      >
                        {expanded === section.id ? '−' : '+'}
                      </button>
                    )}
                  </div>
                  {expanded === section.id && section.children.length > 0 && (
                    <div className="flex flex-col pb-2">
                      {section.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/section/${child.slug}`}
                          onClick={close}
                          className="py-2 pl-3 font-body text-sm text-muted hover:text-primary"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-2">
              {signedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.14em] text-text"
                  >
                    {firstName ?? 'Account'}
                  </Link>
                  {isStaff && (
                    <Link
                      href="/dashboard"
                      onClick={close}
                      className="rounded-lg border border-border px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted"
                    >
                      Newsroom
                    </Link>
                  )}
                  {isEditor && (
                    <Link
                      href="/dashboard/review"
                      onClick={close}
                      className="rounded-lg border border-border px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted"
                    >
                      Review queue
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.14em] text-text"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={close}
                    className="rounded-lg bg-primary px-4 py-2 text-center font-mono text-xs font-semibold uppercase tracking-[0.14em] text-black"
                  >
                    Subscribe
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
