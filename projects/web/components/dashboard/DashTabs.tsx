'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/components/LocaleProvider';
import type { DashTab } from '@/lib/dash-tabs';

/**
 * The tab strip that binds a group of related dashboard pages together — the
 * sidebar carries one entry per group, and these switch between its views
 * (e.g. Workflow → Board / Copy desk / Review). Each tab is a real route, so
 * deep links and the back button keep working.
 */
export function DashTabs({ tabs }: { tabs: DashTab[] }) {
  const pathname = usePathname();
  const t = useT();
  if (tabs.length < 2) return null;

  return (
    <nav aria-label="Views" className="mt-5 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
