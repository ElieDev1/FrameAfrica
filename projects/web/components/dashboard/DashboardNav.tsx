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
import { useT } from '@/components/LocaleProvider';
import type { MessageKey } from '@/lib/i18n';

export type DashboardRole = 'journalist' | 'sub_editor' | 'editor' | 'moderator' | 'admin';

type IconCmp = (p: IconProps) => React.ReactElement;

interface NavItem {
  href: string;
  labelKey: MessageKey;
  Icon: IconCmp;
  exact?: boolean;
}
interface NavGroup {
  sectionKey: MessageKey;
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
  const push = (sectionKey: MessageKey, items: (NavItem | false)[]) => {
    const real = items.filter((i): i is NavItem => Boolean(i));
    if (real.length > 0) groups.push({ sectionKey, items: real });
  };

  // 1. Newsroom — your own work.
  push('dash.sec.newsroom', [
    { href: '/dashboard', labelKey: 'dash.overview', Icon: GridIcon, exact: true },
    { href: '/dashboard/stories', labelKey: 'dash.myStories', Icon: FileTextIcon },
    { href: '/dashboard/stories/new', labelKey: 'dash.newStory', Icon: PlusIcon, exact: true },
    { href: '/dashboard/analytics', labelKey: 'dash.analytics', Icon: BarChartIcon },
  ]);

  // 2. Editorial desk — the review/moderation workflow.
  push('dash.sec.editorial', [
    has('sub_editor', 'editor', 'admin') && {
      href: '/dashboard/copydesk',
      labelKey: 'dash.copyDesk',
      Icon: PenIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/review',
      labelKey: 'dash.reviewQueue',
      Icon: ClipboardCheckIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/pipeline',
      labelKey: 'dash.pipeline',
      Icon: ColumnsIcon,
    },
    has('moderator', 'editor', 'admin') && {
      href: '/dashboard/moderation',
      labelKey: 'dash.moderation',
      Icon: FlagIcon,
    },
    has('moderator', 'editor', 'admin') && {
      href: '/dashboard/tips',
      labelKey: 'dash.tipsInbox',
      Icon: ShieldIcon,
    },
  ]);

  // 3. Media — the library, the studio, and every multimedia content type.
  push('dash.sec.media', [
    { href: '/dashboard/media', labelKey: 'dash.mediaLibrary', Icon: ImageIcon },
    { href: '/dashboard/studio', labelKey: 'dash.studio', Icon: SparklesIcon },
    has('editor', 'admin') && { href: '/dashboard/videos', labelKey: 'mm.videos', Icon: PlayIcon },
    has('photographer', 'editor', 'admin') && {
      href: '/dashboard/galleries',
      labelKey: 'mm.galleries',
      Icon: ImageIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/podcasts',
      labelKey: 'mm.podcasts',
      Icon: MailIcon,
    },
    has('editor', 'admin') && {
      href: '/dashboard/interactives',
      labelKey: 'mm.interactives',
      Icon: BarChartIcon,
    },
  ]);

  // 4. Audience — reader-facing operations.
  push('dash.sec.audience', [
    has('admin') && { href: '/dashboard/inquiries', labelKey: 'dash.inquiries', Icon: CommentIcon },
    has('editor', 'admin') && {
      href: '/dashboard/newsletter',
      labelKey: 'dash.newsletter',
      Icon: MailIcon,
    },
  ]);

  // 5. Administration — system + settings.
  push('dash.sec.admin', [
    has('admin') && { href: '/dashboard/articles', labelKey: 'dash.allArticles', Icon: LayersIcon },
    has('admin') && { href: '/dashboard/taxonomy', labelKey: 'dash.taxonomy', Icon: TagIcon },
    has('admin') && { href: '/dashboard/ads', labelKey: 'dash.houseAds', Icon: MegaphoneIcon },
    has('admin') && { href: '/dashboard/users', labelKey: 'dash.users', Icon: UsersIcon },
    has('admin') && { href: '/dashboard/monitor', labelKey: 'dash.monitor', Icon: ActivityIcon },
    has('admin') && {
      href: '/dashboard/audit',
      labelKey: 'dash.auditLog',
      Icon: ClipboardCheckIcon,
    },
    has('admin') && { href: '/dashboard/settings', labelKey: 'dash.settings', Icon: SettingsIcon },
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
  const t = useT();
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
                title={t(item.labelKey)}
                aria-label={t(item.labelKey)}
                aria-current={active ? 'page' : undefined}
                className={`grid h-10 w-10 place-items-center rounded-lg transition-colors ${
                  active
                    ? 'bg-elev text-primary ring-1 ring-border'
                    : 'text-muted hover:bg-elev hover:text-text'
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
        const isClosed = closed[group.sectionKey];
        return (
          <div key={group.sectionKey}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [group.sectionKey]: !c[group.sectionKey] }))}
              aria-expanded={!isClosed}
              className="flex w-full items-center justify-between px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint hover:text-muted"
            >
              {t(group.sectionKey)}
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
                            ? 'bg-elev font-semibold text-primary ring-1 ring-border'
                            : 'text-muted hover:bg-elev hover:text-text'
                        }`}
                      >
                        <item.Icon size={17} />
                        {t(item.labelKey)}
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
