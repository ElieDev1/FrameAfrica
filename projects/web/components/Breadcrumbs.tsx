'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/components/LocaleProvider';
import type { MessageKey } from '@/lib/i18n';
import { ChevronRightIcon } from './icons';

/** One step in the trail. A crumb without `href` renders as plain text. */
export interface Crumb {
  label: string;
  href?: string;
}

/** Turn a slug/id segment into readable words: `rwanda-coffee` → `Rwanda Coffee`. */
function humanize(segment: string): string {
  const words = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return words.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * An opaque id (cuid, YouTube id) has no hyphen and mixes letters and digits —
 * unlike a word slug, which is hyphen-separated words. We label those from the
 * parent collection instead of showing gibberish.
 */
function looksLikeId(segment: string): boolean {
  return (
    !segment.includes('-') && /[a-z]/i.test(segment) && /\d/.test(segment) && segment.length >= 8
  );
}

/** Shared presentational trail. Hidden when there's nothing but the root. */
function Trail({ items, ariaLabel }: { items: Crumb[]; ariaLabel: string }) {
  if (items.length <= 1) return null;
  return (
    <nav aria-label={ariaLabel} className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-sm text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-x-1.5">
              {i > 0 && <ChevronRightIcon size={14} className="shrink-0 text-faint" />}
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="max-w-[16rem] truncate transition-colors hover:text-primary"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={`max-w-[18rem] truncate ${last ? 'font-semibold text-text' : ''}`}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Public site ───────────────────────────────────────────────────────────────

/** Segment → i18n label for the known public routes. */
const SITE_LABELS: Record<string, MessageKey> = {
  videos: 'mm.videos',
  galleries: 'mm.galleries',
  podcasts: 'mm.podcasts',
  interactives: 'mm.interactives',
  search: 'footer.search',
  'for-you': 'nav.forYou',
  about: 'footer.aboutUs',
  advertise: 'footer.advertise',
  contact: 'footer.contact',
  tips: 'footer.sendTip',
  privacy: 'footer.privacy',
  terms: 'footer.terms',
  standards: 'footer.standards',
  corrections: 'footer.corrections',
  account: 'nav.myAccount',
  login: 'nav.signIn',
  signup: 'nav.subscribe',
};

/**
 * Routes whose page renders its own breadcrumb from server data — a section
 * knows its parent category, an article knows its section — which the pathname
 * alone can't reconstruct. We render nothing here so the two don't stack.
 */
const SITE_SELF_MANAGED = new Set(['section', 'article']);

/** Segments that are route prefixes with no index page — skipped in the trail. */
const SITE_PREFIX_ONLY = new Set(['topic']);

/** Singular label for a detail page whose id is opaque, keyed by parent. */
const SITE_SINGULAR: Record<string, MessageKey> = {
  videos: 'mm.videoSingular',
  galleries: 'mm.gallerySingular',
  podcasts: 'mm.podcastSingular',
  interactives: 'mm.interactiveSingular',
};

/** Breadcrumb trail for the public site: Home › Section › Page. */
export function SiteBreadcrumbs() {
  const pathname = usePathname();
  const t = useT();
  const segments = pathname.split('/').filter(Boolean);

  // Let section/article pages own their (hierarchy-aware) breadcrumb.
  if (segments.length > 0 && SITE_SELF_MANAGED.has(segments[0])) return null;

  const items: Crumb[] = [{ label: t('nav.home'), href: '/' }];
  let href = '';
  segments.forEach((seg, i) => {
    href += `/${seg}`;
    if (SITE_PREFIX_ONLY.has(seg)) return; // e.g. the "/article" in /article/slug
    const last = i === segments.length - 1;
    const parent = segments[i - 1];

    let label: string;
    if (SITE_LABELS[seg]) label = t(SITE_LABELS[seg]);
    else if (looksLikeId(seg) && parent && SITE_SINGULAR[parent]) label = t(SITE_SINGULAR[parent]);
    else label = humanize(seg);

    items.push({ label, href: last ? undefined : href });
  });

  return <Trail items={items} ariaLabel={t('nav.breadcrumb')} />;
}

// ── Newsroom dashboard ────────────────────────────────────────────────────────

/** Segment → label for dashboard routes (staff-facing; English, like the nav). */
const DASH_LABELS: Record<string, string> = {
  stories: 'Stories',
  articles: 'Articles',
  studio: 'Studio',
  media: 'Media library',
  copydesk: 'Copy desk',
  review: 'Review queue',
  moderation: 'Moderation',
  monitor: 'Monitor',
  users: 'Users & roles',
  settings: 'Settings',
  analytics: 'Analytics',
  audit: 'Audit log',
  pipeline: 'Pipeline',
  taxonomy: 'Taxonomy',
  tips: 'Tips',
  inquiries: 'Inquiries',
  newsletter: 'Newsletter',
  ads: 'Advertising',
  galleries: 'Galleries',
  podcasts: 'Podcasts',
  interactives: 'Interactives',
  videos: 'Videos',
  new: 'New',
  studioads: 'Ad studio',
};

/** Breadcrumb trail for the dashboard: Dashboard › Section › Page. */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  // Drop the leading "dashboard" segment; it is the root crumb.
  const segments = pathname.split('/').filter(Boolean).slice(1);

  const items: Crumb[] = [{ label: 'Dashboard', href: '/dashboard' }];
  let href = '/dashboard';
  segments.forEach((seg, i) => {
    href += `/${seg}`;
    const last = i === segments.length - 1;
    const label = DASH_LABELS[seg] ?? (looksLikeId(seg) ? 'Details' : humanize(seg));
    items.push({ label, href: last ? undefined : href });
  });

  return <Trail items={items} ariaLabel="Breadcrumb" />;
}
