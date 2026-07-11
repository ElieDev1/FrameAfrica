'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ActivityIcon,
  BarChartIcon,
  ChevronDownIcon,
  ColumnsIcon,
  ClipboardCheckIcon,
  CommentIcon,
  FileTextIcon,
  FlagIcon,
  GridIcon,
  type IconProps,
  ImageIcon,
  LayersIcon,
  MailIcon,
  MegaphoneIcon,
  PenIcon,
  PlayIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
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

/**
 * Build the dashboard nav for a set of roles, grouped by what the work *is*:
 * Newsroom (your desk), Editorial (the workflow queues), Media (the library +
 * every multimedia type), Audience (reader-facing ops) and Administration.
 * Each group is only shown when the user has at least one item in it.
 */
function groupsFor(roles: string[]): NavGroup[] {
  const has = (...r: string[]) => r.some((x) => roles.includes(x));
  const groups: NavGroup[] = [];
  const push = (section: string, items: (NavItem | false)[]) => {
    const real = items.filter((i): i is NavItem => Boolean(i));
    if (real.length > 0) groups.push({ section, items: real });
  };

  // 1. Newsroom — your own work.
  push('Newsroom', [
    { href: '/dashboard', label: 'Overview', Icon: GridIcon, exact: true },
    { href: '/dashboard/stories', label: 'My stories', Icon: FileTextIcon },
    { href: '/dashboard/stories/new', label: 'New story', Icon: PlusIcon, exact: true },
    { href: '/dashboard/analytics', label: 'Analytics', Icon: BarChartIcon },
  ]);

  // 2. Editorial desk — the review/moderation workflow.
  push('Editorial desk', [
    has('sub_editor', 'editor', 'admin') && {
      href: '/dashboard/copydesk',
      label: 'Copy desk',
      Icon: PenIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/review',
      label: 'Review queue',
      Icon: ClipboardCheckIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/pipeline',
      label: 'Pipeline',
      Icon: ColumnsIcon,
    },
    has('moderator', 'editor', 'admin') && {
      href: '/dashboard/moderation',
      label: 'Moderation',
      Icon: FlagIcon,
    },
    has('moderator', 'editor', 'admin') && {
      href: '/dashboard/tips',
      label: 'Tips inbox',
      Icon: ShieldIcon,
    },
  ]);

  // 3. Media — the library, the studio, and every multimedia content type.
  push('Media', [
    { href: '/dashboard/media', label: 'Media library', Icon: ImageIcon },
    { href: '/dashboard/studio', label: 'Studio', Icon: SparklesIcon },
    has('editor', 'admin') && { href: '/dashboard/videos', label: 'Videos', Icon: PlayIcon },
    has('photographer', 'editor', 'admin') && {
      href: '/dashboard/galleries',
      label: 'Galleries',
      Icon: ImageIcon,
    },
    has('editor', 'admin') && { href: '/dashboard/podcasts', label: 'Podcasts', Icon: MailIcon },
    has('editor', 'admin') && {
      href: '/dashboard/interactives',
      label: 'Data & interactives',
      Icon: BarChartIcon,
    },
  ]);

  // 4. Audience — reader-facing operations.
  push('Audience', [
    has('admin') && { href: '/dashboard/inquiries', label: 'Inquiries', Icon: CommentIcon },
    has('editor', 'admin') && {
      href: '/dashboard/newsletter',
      label: 'Newsletter',
      Icon: MailIcon,
    },
  ]);

  // 5. Administration — system + settings.
  push('Administration', [
    has('admin') && { href: '/dashboard/articles', label: 'All articles', Icon: LayersIcon },
    has('admin') && { href: '/dashboard/taxonomy', label: 'Taxonomy', Icon: TagIcon },
    has('admin') && { href: '/dashboard/ads', label: 'House ads', Icon: MegaphoneIcon },
    has('admin') && { href: '/dashboard/users', label: 'Users & roles', Icon: UsersIcon },
    has('admin') && { href: '/dashboard/monitor', label: 'Monitor', Icon: ActivityIcon },
    has('admin') && { href: '/dashboard/audit', label: 'Audit log', Icon: ClipboardCheckIcon },
    has('admin') && { href: '/dashboard/settings', label: 'Settings', Icon: SettingsIcon },
  ]);

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
