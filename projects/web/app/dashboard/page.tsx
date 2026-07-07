import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { isEditor, listMyDrafts, listReviewQueue, requireStaff } from '@/lib/cms';
import { formatDate } from '@/lib/format';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p
        className={`mt-1 font-heading text-3xl font-black ${accent ? 'text-primary' : 'text-text'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function DashboardHome() {
  const user = await requireStaff();
  const editor = isEditor(user);

  const [drafts, queue] = await Promise.all([
    listMyDrafts(),
    editor ? listReviewQueue() : Promise.resolve([]),
  ]);

  const drafting = drafts.filter((d) =>
    ['draft', 'in_progress', 'rejected'].includes(d.status),
  ).length;
  const inReview = drafts.filter((d) => d.status === 'ready').length;
  const published = drafts.filter((d) => d.status === 'published').length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text">
            Welcome back, {user.displayName.split(' ')[0]}
          </h1>
          <p className="mt-1 font-body text-sm text-muted">Your newsroom at a glance.</p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black hover:opacity-90"
        >
          New story
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="My stories" value={drafts.length} />
        <StatCard label="Drafting" value={drafting} />
        <StatCard label="In review" value={inReview} />
        <StatCard label="Published" value={published} />
      </div>

      {editor && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-text">
              Awaiting review{queue.length > 0 ? ` (${queue.length})` : ''}
            </h2>
            <Link
              href="/dashboard/review"
              className="font-mono text-xs text-primary hover:underline"
            >
              Open queue →
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="font-body text-sm text-muted">Nothing is waiting for review.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {queue.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/stories/${item.id}`}
                      className="block truncate font-body font-semibold text-text hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="font-mono text-xs text-muted">
                      {item.author.displayName} · {item.category.name}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/review"
                    className="shrink-0 font-mono text-xs text-primary hover:underline"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text">Recent stories</h2>
          <Link
            href="/dashboard/stories"
            className="font-mono text-xs text-primary hover:underline"
          >
            All stories →
          </Link>
        </div>
        {drafts.length === 0 ? (
          <p className="font-body text-sm text-muted">
            You have no stories yet.{' '}
            <Link href="/dashboard/stories/new" className="text-primary hover:underline">
              Write your first one.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {drafts.slice(0, 6).map((draft) => (
              <li key={draft.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/stories/${draft.id}`}
                    className="block truncate font-body font-semibold text-text hover:text-primary"
                  >
                    {draft.title}
                  </Link>
                  <p className="font-mono text-xs text-muted">
                    {draft.category.name} · updated {formatDate(draft.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={draft.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
