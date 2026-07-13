import type { MessageKey } from './i18n';

/**
 * The dashboard's grouped views. Several pages were really one job seen from a
 * different angle — the copy desk, the review queue and the pipeline board are
 * the same articles at different stages; "My stories" and "All articles" are
 * the same table at different scopes. Rather than one sidebar entry each, the
 * sidebar carries one entry per group and these tabs switch between the views.
 *
 * Each tab stays a real route (deep links and permissions unchanged); the tab
 * sets are role-aware so a journalist never sees an editor-only view.
 */
export interface DashTab {
  href: string;
  labelKey: MessageKey;
}

const has = (roles: string[], ...wanted: string[]) => wanted.some((r) => roles.includes(r));

/** Stories: your desk, and (for admins) every article on the site. */
export function storiesTabs(roles: string[]): DashTab[] {
  const tabs: DashTab[] = [{ href: '/dashboard/stories', labelKey: 'dash.myStories' }];
  if (has(roles, 'admin')) {
    tabs.push({ href: '/dashboard/articles', labelKey: 'dash.allArticles' });
  }
  return tabs;
}

/** Workflow: the same stories at each stage of the editorial pipeline. */
export function workflowTabs(roles: string[]): DashTab[] {
  const tabs: DashTab[] = [];
  if (has(roles, 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/pipeline', labelKey: 'dash.pipeline' });
  }
  if (has(roles, 'sub_editor', 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/copydesk', labelKey: 'dash.copyDesk' });
  }
  if (has(roles, 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/review', labelKey: 'dash.reviewQueue' });
  }
  return tabs;
}

/** Multimedia: the four content types, previously four sidebar entries. */
export function multimediaTabs(roles: string[]): DashTab[] {
  const tabs: DashTab[] = [];
  if (has(roles, 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/videos', labelKey: 'mm.videos' });
  }
  if (has(roles, 'photographer', 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/galleries', labelKey: 'mm.galleries' });
  }
  if (has(roles, 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/podcasts', labelKey: 'mm.podcasts' });
    tabs.push({ href: '/dashboard/interactives', labelKey: 'mm.interactives' });
  }
  return tabs;
}

/** Insights: the analytics report and the realtime monitor read the same data. */
export function insightsTabs(roles: string[]): DashTab[] {
  const tabs: DashTab[] = [{ href: '/dashboard/analytics', labelKey: 'dash.analytics' }];
  if (has(roles, 'admin')) {
    tabs.push({ href: '/dashboard/monitor', labelKey: 'dash.monitor' });
  }
  return tabs;
}

/** Audience: the two reader-facing inboxes. */
export function audienceTabs(roles: string[]): DashTab[] {
  const tabs: DashTab[] = [];
  if (has(roles, 'admin')) {
    tabs.push({ href: '/dashboard/inquiries', labelKey: 'dash.inquiries' });
  }
  if (has(roles, 'editor', 'admin')) {
    tabs.push({ href: '/dashboard/newsletter', labelKey: 'dash.newsletter' });
  }
  return tabs;
}
