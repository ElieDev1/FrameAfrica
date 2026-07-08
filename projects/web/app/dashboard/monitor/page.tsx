import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { fetchOverview, requireAdmin } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Monitor — Frame Africa' };

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</div>
      <div className="mt-1 font-heading text-3xl font-black text-text">{value}</div>
      {hint && <div className="mt-0.5 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export default async function MonitorPage() {
  await requireAdmin();
  const o = await fetchOverview();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Monitor</h1>
      <p className="mt-2 font-body text-muted">
        A live snapshot of everything happening across Frame Africa.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Users"
          value={o.users.total}
          hint={`${o.users.active} active · ${o.users.suspended} suspended`}
        />
        <Stat label="New (7 days)" value={o.users.newLast7Days} hint="signups this week" />
        <Stat
          label="Published"
          value={o.articles.published}
          hint={`${o.articles.inPipeline} in pipeline`}
        />
        <Stat
          label="Flagged comments"
          value={o.comments.flagged}
          hint={`${o.comments.visible} visible`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border">
          <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-bold text-text">
            Recent articles
          </h2>
          <ul>
            {o.recentArticles.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/articles/${a.id}`}
                    className="block truncate font-body text-sm text-text hover:text-primary"
                  >
                    {a.title}
                  </Link>
                  <div className="font-mono text-[10px] text-muted">by {a.author}</div>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border">
          <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-bold text-text">
            Recent comments
          </h2>
          <ul>
            {o.recentComments.map((c) => (
              <li key={c.id} className="border-b border-border px-4 py-2 last:border-0">
                <p className="font-body text-sm text-text">{c.body}</p>
                <div className="font-mono text-[10px] text-muted">
                  {c.author} ·{' '}
                  <Link href={`/article/${c.articleSlug}`} className="text-primary hover:underline">
                    {c.articleSlug}
                  </Link>{' '}
                  · {formatDate(c.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border lg:col-span-2">
          <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-bold text-text">
            Newest users
          </h2>
          <ul>
            {o.recentUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 last:border-0"
              >
                <div>
                  <span className="font-body text-sm text-text">{u.displayName}</span>{' '}
                  <span className="font-mono text-[11px] text-muted">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] capitalize text-muted">
                    {u.roles.join(', ').replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-[10px] text-faint">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
