import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';

/**
 * Section connector used between homepage bands and atop section pages: an
 * accent tick + label on a hairline rule, with an optional "View all" link.
 */
export function SectionHeading({
  title,
  href,
  linkLabel = 'View all',
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-2">
      <h2
        id={id}
        className="flex items-center gap-2.5 font-heading text-lg font-black uppercase tracking-tight text-text"
      >
        <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary"
        >
          {linkLabel}
          <ChevronRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

/**
 * Compact sibling of {@link SectionHeading} for the sidebar rail — the same
 * accent-tick connector at a smaller scale, so rail widgets (Most read,
 * Editor's picks) read as part of the same section system as the main columns.
 */
export function RailHeading({ title, href, id }: { title: string; href?: string; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-border pb-2">
      <h2
        id={id}
        className="flex items-center gap-2 font-heading text-sm font-black uppercase tracking-tight text-text"
      >
        <span aria-hidden className="h-3.5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary"
        >
          View all
          <ChevronRightIcon size={12} />
        </Link>
      )}
    </div>
  );
}
