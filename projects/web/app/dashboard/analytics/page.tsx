import type { Metadata } from 'next';
import Link from 'next/link';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { BarList, TrendArea } from '@/components/dashboard/OverviewCharts';
import { CommentIcon, EyeIcon, HeartIcon, type IconProps, ShareIcon } from '@/components/icons';
import { fetchAnalytics, requireStaff } from '@/lib/cms';
import { insightsTabs } from '@/lib/dash-tabs';
import { type Locale, t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Analytics — Frame Africa' };

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: (p: IconProps) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-border">
        <Icon size={17} />
      </span>
      <div className="mt-3 font-heading text-3xl font-black tabular-nums text-text">
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      {hint && <div className="mt-1 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-sm font-bold text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Views / likes / comments / shares for every content type — the monitoring core. */
function InteractionsTable({
  rows,
  locale,
}: {
  rows: { type: string; views: number; likes: number; comments: number; shares: number }[];
  locale: Locale;
}) {
  const totals = rows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      likes: acc.likes + r.likes,
      comments: acc.comments + r.comments,
      shares: acc.shares + r.shares,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 },
  );
  const num = (n: number) => n.toLocaleString();
  const head = 'px-2 py-2 text-right font-medium';
  const cell = 'px-2 py-2.5 text-right font-mono tabular-nums text-muted';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wide text-faint">
            <th className="py-2 pr-4 text-left font-medium">{t(locale, 'dana.contentType')}</th>
            <th className={head}>{t(locale, 'dana.colViews')}</th>
            <th className={head}>{t(locale, 'dana.colLikes')}</th>
            <th className={head}>{t(locale, 'dana.colComments')}</th>
            <th className={`${head} pr-0`}>{t(locale, 'dana.colShares')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.type} className="border-b border-border/60">
              <td className="py-2.5 pr-4 font-heading font-semibold capitalize text-text">
                {r.type}
              </td>
              <td className={cell}>{num(r.views)}</td>
              <td className={cell}>{num(r.likes)}</td>
              <td className={cell}>{num(r.comments)}</td>
              <td className={`${cell} pr-0`}>{num(r.shares)}</td>
            </tr>
          ))}
          <tr className="font-semibold text-text">
            <td className="py-2.5 pr-4 font-heading">Total</td>
            <td className={`${cell} text-text`}>{num(totals.views)}</td>
            <td className={`${cell} text-text`}>{num(totals.likes)}</td>
            <td className={`${cell} text-text`}>{num(totals.comments)}</td>
            <td className={`${cell} pr-0 text-text`}>{num(totals.shares)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await requireStaff();
  const [a, locale] = await Promise.all([fetchAnalytics(), getLocale()]);

  const totals = a.totals ?? { views: 0, likes: 0, comments: 0, shares: 0 };
  const byType = a.byType ?? [];
  const viewsTrend = a.viewsTrend ?? [];
  const commentsTrend = a.commentsTrend ?? [];
  const commentStatus = a.commentStatus ?? [];
  const topArticles = a.topArticles ?? [];
  const max = Math.max(1, ...a.topToday.map((r) => r.views));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dash.analytics')}
          </h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted">
            {t(locale, 'dpage.analyticsSubtitle')}
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted">
          <span className="text-accent-green">●</span> {a.readingNow} {t(locale, 'dana.readingNow')}
          {' · '}
          {a.totalToday.toLocaleString()} {t(locale, 'dana.viewsToday')}
        </p>
      </div>

      <DashTabs tabs={insightsTabs(user.roles)} />

      {/* Site-wide interaction totals */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={EyeIcon} label={t(locale, 'dana.totalViews')} value={totals.views} />
        <Stat icon={HeartIcon} label={t(locale, 'dana.totalLikes')} value={totals.likes} />
        <Stat icon={CommentIcon} label={t(locale, 'dana.totalComments')} value={totals.comments} />
        <Stat icon={ShareIcon} label={t(locale, 'dana.totalShares')} value={totals.shares} />
      </div>

      {/* Trends */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel
          title={t(locale, 'dana.viewsTrendTitle')}
          action={
            <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
              {t(locale, 'dana.last14Days')}
            </span>
          }
        >
          <TrendArea data={viewsTrend} />
        </Panel>
        <Panel
          title={t(locale, 'dana.commentsTrendTitle')}
          action={
            <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
              {t(locale, 'dana.last14Days')}
            </span>
          }
        >
          <TrendArea data={commentsTrend} />
        </Panel>
      </div>

      {/* Interactions by content type — the monitoring core */}
      <div className="mt-4">
        <Panel title={t(locale, 'dana.interactionsByType')}>
          {byType.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dana.noData')}</p>
          ) : (
            <InteractionsTable rows={byType} locale={locale} />
          )}
        </Panel>
      </div>

      {/* Comment health + most-viewed */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title={t(locale, 'dana.commentHealth')}>
          {commentStatus.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dana.noData')}</p>
          ) : (
            <BarList
              items={commentStatus.map((s) => ({ label: s.status, count: s.count }))}
              highlight="visible"
            />
          )}
        </Panel>
        <Panel title={t(locale, 'dana.topByViews')}>
          {topArticles.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dana.noData')}</p>
          ) : (
            <ol className="space-y-3">
              {topArticles.map((row, i) => (
                <li key={row.id} className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/article/${row.slug}`}
                    className="truncate font-heading text-sm font-semibold text-text hover:text-primary"
                  >
                    <span className="mr-2 text-faint">{i + 1}</span>
                    {row.title}
                  </Link>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {row.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* Most read today (live) + referrers */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={t(locale, 'dana.mostReadToday')}>
          {a.topToday.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dana.noViewsToday')}</p>
          ) : (
            <ol className="space-y-3">
              {a.topToday.map((row, i) => (
                <li key={row.article.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/article/${row.article.slug}`}
                      className="truncate font-heading text-sm font-bold text-text hover:text-primary"
                    >
                      <span className="mr-2 text-faint">{i + 1}</span>
                      {row.article.title}
                    </Link>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                      {row.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-faint/60"
                      style={{ width: `${Math.max(4, (row.views / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title={t(locale, 'dana.topReferrers')}>
          {a.topReferrers.length === 0 ? (
            <p className="font-body text-sm text-muted">{t(locale, 'dpage.noReferrers')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {a.topReferrers.map((r) => (
                <li key={r.host} className="flex items-center justify-between py-2.5">
                  <span className="truncate font-body text-sm text-text">{r.host}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
                    {r.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
