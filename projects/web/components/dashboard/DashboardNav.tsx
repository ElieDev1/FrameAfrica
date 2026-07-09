'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ActivityIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FlagIcon,
  GridIcon,
  type IconProps,
  ImageIcon,
  LayersIcon,
  PenIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  TagIcon,
  UsersIcon,
} from '@/components/icons';

export type DashboardRole = 'journalist' | 'sub_editor' | 'editor' | 'moderator' | 'admin';

type IconCmp = (p: IconProps) => React.ReactElement;

interface NavItem {
  href: string;
  label: string;
  Icon: IconCmp;
  exact?: boolean;
}
interface NavGroup {
  section: string;
  items: NavItem[];
}

function groupsFor(roles: string[]): NavGroup[] {
  const has = (...r: string[]) => r.some((x) => roles.includes(x));

  const desk: NavItem[] = [];
  if (has('sub_editor', 'editor', 'admin')) {
    desk.push({ href: '/dashboard/copydesk', label: 'Copy desk', Icon: PenIcon });
  }
  if (has('editor', 'admin')) {
    desk.push({ href: '/dashboard/review', label: 'Review queue', Icon: ClipboardCheckIcon });
  }
  if (has('moderator', 'editor', 'admin')) {
    desk.push({ href: '/dashboard/moderation', label: 'Moderation', Icon: FlagIcon });
  }

  const groups: NavGroup[] = [
    {
      section: 'Newsroom',
      items: [
        { href: '/dashboard', label: 'Overview', Icon: GridIcon, exact: true },
        { href: '/dashboard/stories', label: 'My stories', Icon: FileTextIcon },
        { href: '/dashboard/stories/new', label: 'New story', Icon: PlusIcon, exact: true },
        { href: '/dashboard/media', label: 'Media library', Icon: ImageIcon },
        { href: '/dashboard/studio', label: 'Studio', Icon: SparklesIcon },
        ...desk,
      ],
    },
  ];

  if (has('admin')) {
    groups.push({
      section: 'Administration',
      items: [
        { href: '/dashboard/monitor', label: 'Monitor', Icon: ActivityIcon },
        { href: '/dashboard/articles', label: 'All articles', Icon: LayersIcon },
        { href: '/dashboard/taxonomy', label: 'Taxonomy', Icon: TagIcon },
        { href: '/dashboard/users', label: 'Users & roles', Icon: UsersIcon },
        { href: '/dashboard/settings', label: 'Settings', Icon: SettingsIcon },
      ],
    });
  }
  return groups;
}

export function DashboardNav({
  roles,
  collapsed = false,
}: {
  roles: string[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const groups = groupsFor(roles);
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  // Icons-only rail (collapsed sidebar).
  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1">
        {groups
          .flatMap((g) => g.items)
          .map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`grid h-10 w-10 place-items-center rounded-lg transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-text'
                }`}
              >
                <item.Icon size={18} />
              </Link>
            );
          })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => {
        const isClosed = closed[group.section];
        return (
          <div key={group.section}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [group.section]: !c[group.section] }))}
              aria-expanded={!isClosed}
              className="flex w-full items-center justify-between px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint hover:text-muted"
            >
              {group.section}
              <ChevronDownIcon
                size={13}
                className={`transition-transform ${isClosed ? '-rotate-90' : ''}`}
              />
            </button>
            {!isClosed && (
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-primary/15 font-semibold text-primary'
                            : 'text-muted hover:bg-surface-2 hover:text-text'
                        }`}
                      >
                        <item.Icon size={17} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
