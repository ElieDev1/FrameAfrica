import Link from 'next/link';
import type { CategoryNode } from '@/lib/api';

/** Short nav label: drop the "& …" tail so the bar stays on one line. */
function shortLabel(name: string): string {
  return name.split(' & ')[0];
}

/**
 * Desktop section bar: top sections on a single row, each opening a polished
 * mega-menu of its sub-sections on hover or keyboard focus (pure CSS — no
 * client JS). Lives in its own row under the utility bar (see SiteHeader).
 */
export function DesktopSectionNav({ sections }: { sections: CategoryNode[] }) {
  return (
    <nav aria-label="Sections">
      <ul className="flex items-center">
        {sections.map((section) => (
          <li key={section.id} className="group relative">
            <Link
              href={`/section/${section.slug}`}
              className="relative inline-flex items-center gap-1 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-text group-focus-within:text-text after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100 group-focus-within:after:scale-x-100"
            >
              {shortLabel(section.name)}
              {section.children.length > 0 && (
                <span aria-hidden className="text-[8px] opacity-50">
                  ▾
                </span>
              )}
            </Link>

            {section.children.length > 0 && (
              <div className="invisible absolute left-0 top-full z-30 w-max min-w-[15rem] max-w-[34rem] translate-y-1 rounded-2xl border border-border bg-surface/95 p-3 opacity-0 shadow-2xl backdrop-blur-xl transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="mb-2 flex items-center justify-between gap-8 border-b border-border pb-2">
                  <span className="font-heading text-sm font-bold text-text">{section.name}</span>
                  <Link
                    href={`/section/${section.slug}`}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div
                  className={
                    section.children.length > 5
                      ? 'grid grid-cols-2 gap-x-6 gap-y-0.5'
                      : 'grid grid-cols-1 gap-y-0.5'
                  }
                >
                  {section.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/section/${child.slug}`}
                      className="rounded-lg px-2.5 py-1.5 font-body text-sm text-muted transition-colors hover:bg-surface-2 hover:text-primary"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
