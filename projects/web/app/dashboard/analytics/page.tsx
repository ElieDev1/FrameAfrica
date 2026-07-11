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
import { t } from '@/lib/i18n';
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
  const [a, locale] = await Promise.all([fetchAnalytics(), getLocale()]);
  const max = Math.max(1, ...a.topToday.map((r) => r.views));

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.analytics')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.analyticsSubtitle')}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          icon={ActivityIcon}
          label={t(locale, 'dana.readingNow')}
          value={a.readingNow}
          hint={t(locale, 'dana.last5min')}
        />
        <Stat
          icon={EyeIcon}
          label={t(locale, 'dana.viewsToday')}
          value={a.totalToday}
          hint={t(locale, 'dana.sinceMidnight')}
        />
        <Stat
          icon={TrendingUpIcon}
          label={t(locale, 'dana.topStories')}
          value={a.topToday.length}
          hint={t(locale, 'dana.rankedToday')}
        />
        <Stat
          icon={BarChartIcon}
          label={t(locale, 'dana.referrers')}
          value={a.topReferrers.reduce((s, r) => s + r.views, 0)}
          hint={t(locale, 'dana.fromSources')}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Most read — a real bar chart */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {t(locale, 'dana.mostReadToday')}
          </h2>
          {a.topToday.length === 0 ? (
            <p className="mt-4 font-body text-sm text-muted">{t(locale, 'dana.noViewsToday')}</p>
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
            {t(locale, 'dana.topReferrers')}
          </h2>
          {a.topReferrers.length === 0 ? (
            <p className="mt-4 font-body text-sm text-muted">{t(locale, 'dpage.noReferrers')}</p>
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
