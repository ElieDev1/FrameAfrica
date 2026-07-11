import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ActivityIcon,
  BarChartIcon,
  EyeIcon,
  type IconProps,
  TrendingUpIcon,
} from '@/components/icons';
import { fetchAnalytics, requireStaff } from '@/lib/cms';

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
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15">
        <Icon size={17} />
      </span>
      <div className="mt-3 font-heading text-3xl font-black text-text">
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      {hint && <div className="mt-1 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export default async function AnalyticsPage() {
  await requireStaff();
  const a = await fetchAnalytics();
  const max = Math.max(1, ...a.topToday.map((r) => r.views));

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Analytics</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Live story performance — anonymous page views, refreshed on load.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={ActivityIcon} label="Reading now" value={a.readingNow} hint="last 5 min" />
        <Stat icon={EyeIcon} label="Views today" value={a.totalToday} hint="since midnight" />
        <Stat
          icon={TrendingUpIcon}
          label="Top stories"
          value={a.topToday.length}
          hint="ranked today"
        />
        <Stat
          icon={BarChartIcon}
          label="Referrers"
          value={a.topReferrers.reduce((s, r) => s + r.views, 0)}
          hint="from sources · 24h"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Most read — a real bar chart */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Most read today
          </h2>
          {a.topToday.length === 0 ? (
            <p className="mt-4 font-body text-sm text-muted">
              No article views recorded yet today.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
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
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {row.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (row.views / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Referrers */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Top referrers (24h)
          </h2>
          {a.topReferrers.length === 0 ? (
            <p className="mt-4 font-body text-sm text-muted">No external referrers yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {a.topReferrers.map((r) => (
                <li key={r.host} className="flex items-center justify-between py-2.5">
                  <span className="truncate font-body text-sm text-text">{r.host}</span>
                  <span className="shrink-0 font-mono text-sm text-muted">
                    {r.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
