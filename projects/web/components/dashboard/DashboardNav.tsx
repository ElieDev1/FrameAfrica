'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
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
  MegaphoneIcon,
  PlayIcon,
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
  /**
   * Extra routes this entry owns. A grouped entry (Workflow, Multimedia…) links
   * to one of its tabs but must stay highlighted while the reader is on any of
   * them — these are the sibling routes its tab strip switches between.
   */
  match?: string[];
}
interface NavGroup {
  sectionKey: MessageKey;
  items: NavItem[];
}

/**
 * Build the dashboard nav for a set of roles, grouped by what the work *is*:
 * Newsroom (your desk), Editorial (the queues), Media, Audience and
 * Administration. Each group is only shown when the user has an item in it.
 *
 * Several pages are really one job seen from a different angle, so they share a
 * single entry here and switch views with a tab strip on the page itself
 * (lib/dash-tabs):
 *   Stories     → My stories | All articles (admin)
 *   Workflow    → Pipeline board | Copy desk | Review queue
 *   Multimedia  → Videos | Galleries | Podcasts | Data
 *   Analytics   → Report | Monitor (admin)
 *   Audience    → Inquiries | Newsletter
 * "New story" is an action, not a destination — it's the button in the topbar
 * and on the Stories page, so it isn't a nav item.
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
    {
      href: '/dashboard/stories',
      labelKey: 'dash.stories',
      Icon: FileTextIcon,
      match: ['/dashboard/articles'],
    },
    {
      href: '/dashboard/analytics',
      labelKey: 'dash.analytics',
      Icon: BarChartIcon,
      match: ['/dashboard/monitor'],
    },
  ]);

  // 2. Editorial desk — the review/moderation workflow.
  push('dash.sec.editorial', [
    has('sub_editor', 'editor', 'admin') && {
      href: has('editor', 'admin') ? '/dashboard/pipeline' : '/dashboard/copydesk',
      labelKey: 'dash.workflow',
      Icon: ColumnsIcon,
      match: ['/dashboard/pipeline', '/dashboard/copydesk', '/dashboard/review'],
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

  // 3. Media — the library, the studio, and the multimedia types.
  push('dash.sec.media', [
    { href: '/dashboard/media', labelKey: 'dash.mediaLibrary', Icon: ImageIcon },
    { href: '/dashboard/studio', labelKey: 'dash.studio', Icon: SparklesIcon },
    has('photographer', 'editor', 'admin') && {
      href: has('editor', 'admin') ? '/dashboard/videos' : '/dashboard/galleries',
      labelKey: 'dash.multimedia',
      Icon: PlayIcon,
      match: [
        '/dashboard/videos',
        '/dashboard/galleries',
        '/dashboard/podcasts',
        '/dashboard/interactives',
      ],
    },
  ]);

  // 4. Audience — reader-facing operations.
  push('dash.sec.audience', [
    has('editor', 'admin') && {
      href: has('admin') ? '/dashboard/inquiries' : '/dashboard/newsletter',
      labelKey: 'dash.audience',
      Icon: CommentIcon,
      match: ['/dashboard/inquiries', '/dashboard/newsletter'],
    },
  ]);

  // 5. Administration — system + settings.
  push('dash.sec.admin', [
    has('admin') && { href: '/dashboard/taxonomy', labelKey: 'dash.taxonomy', Icon: TagIcon },
    has('admin') && { href: '/dashboard/ads', labelKey: 'dash.houseAds', Icon: MegaphoneIcon },
    has('admin') && { href: '/dashboard/users', labelKey: 'dash.users', Icon: UsersIcon },
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

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    const owns = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
    return owns(item.href) || (item.match?.some(owns) ?? false);
  };

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
