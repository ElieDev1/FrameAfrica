'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type DashboardRole = 'journalist' | 'editor' | 'admin';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

function itemsFor(role: DashboardRole): { section: string; items: NavItem[] }[] {
  const groups: { section: string; items: NavItem[] }[] = [
    {
      section: 'Newsroom',
      items: [
        { href: '/dashboard', label: 'Overview', icon: '▚', exact: true },
        { href: '/dashboard/stories', label: 'My stories', icon: '✎' },
        { href: '/dashboard/stories/new', label: 'New story', icon: '＋', exact: true },
        { href: '/dashboard/media', label: 'Media library', icon: '▣' },
        { href: '/dashboard/studio', label: 'Studio', icon: '◆' },
      ],
    },
  ];

  if (role === 'editor' || role === 'admin') {
    groups[0].items.push({ href: '/dashboard/review', label: 'Review queue', icon: '⧗' });
    groups[0].items.push({ href: '/dashboard/moderation', label: 'Moderation', icon: '⚑' });
  }
  if (role === 'admin') {
    groups.push({
      section: 'Administration',
      items: [
        { href: '/dashboard/monitor', label: 'Monitor', icon: '◉' },
        { href: '/dashboard/articles', label: 'All articles', icon: '▤' },
        { href: '/dashboard/taxonomy', label: 'Taxonomy', icon: '⋔' },
        { href: '/dashboard/users', label: 'Users & roles', icon: '☷' },
        { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
      ],
    });
  }
  return groups;
}

export function DashboardNav({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const groups = itemsFor(role);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            {group.section}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 font-body text-sm transition-colors ${
                      active
                        ? 'bg-primary/15 font-semibold text-primary'
                        : 'text-muted hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    <span aria-hidden className="w-4 text-center">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
