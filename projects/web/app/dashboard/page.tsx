import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { BarList, TrendArea } from '@/components/dashboard/OverviewCharts';
import {
  ClipboardCheckIcon,
  CommentIcon,
  FileTextIcon,
  type IconProps,
  LayersIcon,
  PenIcon,
  UsersIcon,
} from '@/components/icons';
import { fetchOverview, isEditor, listMyDrafts, listReviewQueue, requireStaff } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { type Locale, t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: (p: IconProps) => React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg ring-1 ring-border ${
          accent ? 'bg-surface-2 text-text' : 'bg-surface-2 text-muted'
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="mt-3 font-heading text-3xl font-black text-text">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      {hint && <div className="mt-1 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

/** Compact label + big number, for the engagement and media strips. */
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-heading text-2xl font-black tabular-nums text-text">
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
    </div>
  );
}

/** A titled panel used across the advanced overview. */
function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      <h3 className="mb-4 font-heading text-sm font-bold text-text">{title}</h3>
      {children}
    </div>
  );
}

function StoryList({
  items,
  locale,
}: {
  items: {
    id: string;
    title: string;
    category: { name: string };
    status: string;
    updatedAt: string;
  }[];
  locale: Locale;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <Link
              href={`/dashboard/stories/${d.id}`}
              className="block truncate font-heading font-bold text-text hover:text-primary"
            >
              {d.title}
            </Link>
            <p className="font-mono text-xs text-muted">
              {d.category.name} · {t(locale, 'dov.updated')} {formatDate(d.updatedAt)}
            </p>
          </div>
          <StatusBadge status={d.status} />
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardHome() {
  const user = await requireStaff();
  const locale = await getLocale();
  const editor = isEditor(user);
  const admin = user.roles.includes('admin');

  const [drafts, queue, overview] = await Promise.all([
    listMyDrafts(),
    editor ? listReviewQueue() : Promise.resolve([]),
    admin ? fetchOverview().catch(() => null) : Promise.resolve(null),
  ]);

  const drafting = drafts.filter((d) =>
    ['draft', 'in_progress', 'rejected'].includes(d.status),
  ).length;
  const inReview = drafts.filter((d) => d.status === 'ready').length;
  const published = drafts.filter((d) => d.status === 'published').length;

  // Advanced-overview data, with fallbacks so the page holds up if the API
  // hasn't shipped these fields yet.
  const trend = overview?.publishTrend ?? [];
  const byStatus = overview?.articlesByStatus ?? [];
  const topCats = overview?.topCategories ?? [];
  const media = overview?.media ?? { videos: 0, galleries: 0, episodes: 0, interactives: 0 };
  const engagement = overview?.engagement ?? { views: 0, likes: 0, comments: 0, shares: 0 };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dash.welcome')}, {user.displayName.split(' ')[0]}
          </h1>
          <p className="mt-1 font-body text-sm text-muted">
            {admin ? t(locale, 'dov.subtitleAdmin') : t(locale, 'dov.subtitleStaff')}
          </p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
        >
          <PenIcon size={16} /> {t(locale, 'dash.newStory')}
        </Link>
      </div>

      {/* System overview (admins) — KPIs + charts + activity */}
      {overview && (
        <>
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {t(locale, 'dov.systemOverview')}
              </h2>
              <Link
                href="/dashboard/monitor"
                className="font-mono text-xs text-primary hover:underline"
              >
                {t(locale, 'dov.openMonitor')}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={UsersIcon}
                label={t(locale, 'dov.users')}
                value={overview.users.total}
                hint={`${overview.users.newLast7Days} ${t(locale, 'dov.newThisWeek')}`}
                accent
              />
              <StatCard
                icon={FileTextIcon}
                label={t(locale, 'dov.published')}
                value={overview.articles.published}
                hint={`${overview.articles.inPipeline} ${t(locale, 'dov.inPipelineHint')}`}
                accent
              />
              <StatCard
                icon={LayersIcon}
                label={t(locale, 'dov.inPipeline')}
                value={overview.articles.inPipeline}
                hint={t(locale, 'dov.draftsReady')}
                accent
              />
              <StatCard
                icon={CommentIcon}
                label={t(locale, 'dov.flaggedComments')}
                value={overview.comments.flagged}
                hint={`${overview.comments.visible} ${t(locale, 'dov.visible')}`}
                accent
              />
            </div>
          </section>

          {/* Publishing trend + engagement */}
          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="font-heading text-sm font-bold text-text">
                  {t(locale, 'dov.publishingTrend')}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                  {t(locale, 'dov.last14Days')}
                </span>
              </div>
              <TrendArea data={trend} />
            </div>
            <Panel title={t(locale, 'dov.engagement')}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <MiniStat label={t(locale, 'dov.views')} value={engagement.views} />
                <MiniStat label={t(locale, 'dov.likes')} value={engagement.likes} />
                <MiniStat label={t(locale, 'dov.comments')} value={engagement.comments} />
                <MiniStat label={t(locale, 'dov.shares')} value={engagement.shares} />
              </div>
            </Panel>
          </section>

          {/* Pipeline breakdown + top desks */}
          <section className="mt-4 grid gap-4 md:grid-cols-2">
            <Panel title={t(locale, 'dov.pipelineBreakdown')}>
              <BarList
                items={byStatus.map((s) => ({ label: s.status, count: s.count }))}
                highlight="published"
              />
            </Panel>
            <Panel title={t(locale, 'dov.topDesks')}>
              {topCats.length > 0 ? (
                <BarList items={topCats.map((c) => ({ label: c.name, count: c.count }))} />
              ) : (
                <p className="font-body text-sm text-muted">{t(locale, 'dov.noData')}</p>
              )}
            </Panel>
          </section>

          {/* Media library */}
          <section className="mt-4">
            <Panel title={t(locale, 'dov.mediaLibrary')}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                <MiniStat label={t(locale, 'mm.videos')} value={media.videos} />
                <MiniStat label={t(locale, 'mm.galleries')} value={media.galleries} />
                <MiniStat label={t(locale, 'dov.episodes')} value={media.episodes} />
                <MiniStat label={t(locale, 'mm.interactives')} value={media.interactives} />
              </div>
            </Panel>
          </section>

          {/* Recent activity */}
          <section className="mt-4 grid gap-4 md:grid-cols-2">
            <Panel title={t(locale, 'dov.recentComments')}>
              {overview.recentComments.length === 0 ? (
                <p className="font-body text-sm text-muted">{t(locale, 'dov.noData')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {overview.recentComments.slice(0, 5).map((c) => (
                    <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                      <p className="line-clamp-2 font-body text-sm leading-snug text-text">
                        {c.body}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {c.author} · {formatDate(c.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t(locale, 'dov.newMembers')}>
              {overview.recentUsers.length === 0 ? (
                <p className="font-body text-sm text-muted">{t(locale, 'dov.noData')}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {overview.recentUsers.slice(0, 5).map((u) => (
                    <li key={u.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 font-heading text-xs font-bold text-muted ring-1 ring-border">
                        {u.displayName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-sm font-semibold text-text">
                          {u.displayName}
                        </p>
                        <p className="truncate font-mono text-[11px] text-muted">
                          {u.roles.join(', ') || 'reader'} · {formatDate(u.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>
        </>
      )}

      {/* Your work */}
      <section className="mt-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          {t(locale, 'dov.yourWork')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={FileTextIcon} label={t(locale, 'dov.myStories')} value={drafts.length} />
          <StatCard icon={PenIcon} label={t(locale, 'dov.drafting')} value={drafting} />
          <StatCard icon={ClipboardCheckIcon} label={t(locale, 'dov.inReview')} value={inReview} />
          <StatCard icon={FileTextIcon} label={t(locale, 'dov.published')} value={published} />
        </div>
      </section>

      {/* Awaiting review (editors) */}
      {editor && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-text">
              {t(locale, 'dov.awaitingReview')}
              {queue.length > 0 ? ` (${queue.length})` : ''}
            </h2>
            <Link
              href="/dashboard/review"
              className="font-mono text-xs text-primary hover:underline"
            >
              {t(locale, 'dov.openQueue')}
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dov.nothingReview')}</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {queue.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/stories/${item.id}`}
                      className="block truncate font-heading font-bold text-text hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="font-mono text-xs text-muted">
                      {item.author.displayName} · {item.category.name}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/review"
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary"
                  >
                    {t(locale, 'dov.review')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Recent stories */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text">
            {t(locale, 'dov.recentStories')}
          </h2>
          <Link
            href="/dashboard/stories"
            className="font-mono text-xs text-primary hover:underline"
          >
            {t(locale, 'dov.allStories')}
          </Link>
        </div>
        {drafts.length === 0 ? (
          <p className="font-body text-sm text-muted">
            {t(locale, 'dov.noStoriesYet')}{' '}
            <Link href="/dashboard/stories/new" className="text-primary hover:underline">
              {t(locale, 'dov.writeFirst')}
            </Link>
          </p>
        ) : (
          <StoryList items={drafts.slice(0, 6)} locale={locale} />
        )}
      </section>
    </div>
  );
}
