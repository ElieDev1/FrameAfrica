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

function itemsFor(roles: string[]): { section: string; items: NavItem[] }[] {
  const has = (...r: string[]) => r.some((x) => roles.includes(x));
  const desk: NavItem[] = [];
  if (has('sub_editor', 'editor', 'admin')) {
    desk.push({ href: '/dashboard/copydesk', label: 'Copy desk', icon: '✍' });
  }
  if (has('editor', 'admin')) {
    desk.push({ href: '/dashboard/review', label: 'Review queue', icon: '⧗' });
  }
  if (has('moderator', 'editor', 'admin')) {
    desk.push({ href: '/dashboard/moderation', label: 'Moderation', icon: '⚑' });
  }

  const groups: { section: string; items: NavItem[] }[] = [
    {
      section: 'Newsroom',
      items: [
        { href: '/dashboard', label: 'Overview', icon: '▚', exact: true },
        { href: '/dashboard/stories', label: 'My stories', icon: '✎' },
        { href: '/dashboard/stories/new', label: 'New story', icon: '＋', exact: true },
        { href: '/dashboard/media', label: 'Media library', icon: '▣' },
        { href: '/dashboard/studio', label: 'Studio', icon: '◆' },
        ...desk,
      ],
    },
  ];

  if (has('admin')) {
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

export function DashboardNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const groups = itemsFor(roles);

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
