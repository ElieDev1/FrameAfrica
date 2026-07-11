import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import {
  CommentIcon,
  FileTextIcon,
  FlagIcon,
  type IconProps,
  SparklesIcon,
  UsersIcon,
} from '@/components/icons';
import { fetchOverview, requireAdmin } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Monitor — Frame Africa' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function StatCard({
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
      <div className="mt-3 font-heading text-3xl font-black text-text">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      {hint && <div className="mt-1 font-mono text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: (p: IconProps) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon size={15} className="text-primary" />
        <h2 className="font-heading text-sm font-bold text-text">{title}</h2>
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

export default async function MonitorPage() {
  await requireAdmin();
  const o = await fetchOverview();

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Monitor</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        A live snapshot of everything happening across Frame Africa.
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Users"
          value={o.users.total}
          hint={`${o.users.active} active · ${o.users.suspended} suspended`}
        />
        <StatCard
          icon={SparklesIcon}
          label="New (7 days)"
          value={o.users.newLast7Days}
          hint="signups this week"
        />
        <StatCard
          icon={FileTextIcon}
          label="Published"
          value={o.articles.published}
          hint={`${o.articles.inPipeline} in pipeline`}
        />
        <StatCard
          icon={FlagIcon}
          label="Flagged comments"
          value={o.comments.flagged}
          hint={`${o.comments.visible} visible`}
        />
      </div>

      {/* Activity panels */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent articles" icon={FileTextIcon}>
          {o.recentArticles.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/articles/${a.id}`}
                  className="block truncate font-heading text-sm font-bold text-text hover:text-primary"
                >
                  {a.title}
                </Link>
                <div className="font-mono text-[10px] text-muted">by {a.author}</div>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </Panel>

        <Panel title="Recent comments" icon={CommentIcon}>
          {o.recentComments.map((c) => (
            <li key={c.id} className="flex gap-3 px-4 py-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 font-heading text-[10px] font-black text-muted ring-1 ring-border">
                {initials(c.author)}
              </span>
              <div className="min-w-0">
                <p className="line-clamp-2 font-body text-sm text-text">{c.body}</p>
                <div className="font-mono text-[10px] text-muted">
                  {c.author} ·{' '}
                  <Link href={`/article/${c.articleSlug}`} className="text-primary hover:underline">
                    {c.articleSlug}
                  </Link>{' '}
                  · {formatDate(c.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Newest users" icon={UsersIcon}>
            {o.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 font-heading text-[11px] font-black text-primary ring-1 ring-primary/20">
                  {initials(u.displayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-heading text-sm font-bold text-text">{u.displayName}</span>{' '}
                  <span className="font-mono text-[11px] text-muted">{u.email}</span>
                </div>
                <span className="hidden font-mono text-[10px] capitalize text-muted sm:block">
                  {u.roles.join(', ').replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-[10px] text-faint">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
