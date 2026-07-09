import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAnalytics, requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Analytics — Frame Africa' };

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</div>
      <div className="mt-1 font-heading text-3xl font-black text-text">
        {value.toLocaleString()}
      </div>
      {hint && <div className="mt-0.5 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export default async function AnalyticsPage() {
  await requireStaff();
  const a = await fetchAnalytics();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Analytics</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Live story performance — anonymous page views, refreshed on load.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Reading now" value={a.readingNow} hint="last 5 min" />
        <Stat label="Views today" value={a.totalToday} hint="since midnight" />
        <Stat label="Top stories" value={a.topToday.length} hint="today" />
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Most read today
        </h2>
        {a.topToday.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted">No article views recorded yet today.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border rounded-xl border border-border">
            {a.topToday.map((row, i) => (
              <li key={row.article.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-heading text-lg font-black text-faint">{i + 1}</span>
                <Link
                  href={`/article/${row.article.slug}`}
                  className="flex-1 font-heading font-bold text-text hover:text-primary"
                >
                  {row.article.title}
                </Link>
                <span className="font-mono text-sm text-muted">{row.views.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Top referrers (24h)
        </h2>
        {a.topReferrers.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted">No external referrers yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {a.topReferrers.map((r) => (
              <li key={r.host} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-body text-sm text-text">{r.host}</span>
                <span className="font-mono text-sm text-muted">{r.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
