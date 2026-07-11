import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
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
        className={`grid h-9 w-9 place-items-center rounded-lg ring-1 ${
          accent
            ? 'bg-primary/12 text-primary ring-primary/15'
            : 'bg-surface-2 text-muted ring-border'
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

      {/* System overview (admins) */}
      {overview && (
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
