import Link from 'next/link';
import type { CategoryNode } from '@/lib/api';

/**
 * Desktop section navigation: top sections as links, each with a sub-section
 * dropdown (from the nested taxonomy, WS2). Pure CSS — the dropdown opens on
 * hover and on keyboard focus (`focus-within`), so it needs no client JS.
 */
export function DesktopSectionNav({ sections }: { sections: CategoryNode[] }) {
  return (
    <nav aria-label="Sections" className="hidden flex-wrap items-center gap-0.5 md:flex">
      {sections.map((section) => (
        <div key={section.id} className="group relative">
          <Link
            href={`/section/${section.slug}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary group-focus-within:text-primary"
          >
            {section.name}
            {section.children.length > 0 && (
              <span aria-hidden className="text-[8px] opacity-60">
                ▾
              </span>
            )}
          </Link>

          {section.children.length > 0 && (
            <div className="invisible absolute left-0 top-full z-30 min-w-[12rem] translate-y-1 rounded-xl border border-border bg-surface p-1.5 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {section.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/section/${child.slug}`}
                  className="block rounded-lg px-3 py-2 font-body text-sm text-muted transition-colors hover:bg-surface-2 hover:text-primary"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
