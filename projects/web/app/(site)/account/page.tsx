import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClearHistoryButton } from '@/components/account/ClearHistoryButton';
import { DeleteAccountForm } from '@/components/account/DeleteAccountForm';
import { FollowedList } from '@/components/account/FollowedList';
import { CheckIcon } from '@/components/icons';
import type { SavedArticle } from '@/lib/api';
import { logout } from '@/lib/auth-actions';
import { fetchSaved } from '@/lib/bookmarks-actions';
import { fetchFollows } from '@/lib/follows-actions';
import { formatDate } from '@/lib/format';
import { fetchHistory, type HistoryArticle } from '@/lib/history-actions';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Your account — Frame Africa' };

const STAFF_ROLES = ['journalist', 'sub_editor', 'photographer', 'editor', 'moderator', 'admin'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default async function AccountPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  const isStaff = user.roles.some((role) => STAFF_ROLES.includes(role));
  const [saved, follows, history] = await Promise.all([
    fetchSaved(),
    fetchFollows(),
    fetchHistory(),
  ]);
  const followingCount = follows.sections.length + follows.topics.length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* ---- Profile header ---- */}
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar, arbitrary host
            <img
              src={user.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 font-heading text-2xl font-black text-primary">
              {initials(user.displayName)}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-black tracking-tight text-text">
              {user.displayName}
            </h1>
            <p className="truncate font-body text-sm text-muted">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {(user.roles.length ? user.roles : ['reader']).map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                >
                  {r.replace('_', ' ')}
                </span>
              ))}
              {user.twoFactorEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-green">
                  <CheckIcon size={11} aria-hidden /> 2FA on
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Link
            href="/for-you"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            For You
          </Link>
          {isStaff && (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
            >
              Newsroom
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent-red hover:text-accent-red"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>

      {/* ---- Stats ---- */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatTile label="Following" value={followingCount} />
        <StatTile label="Saved" value={saved.length} />
        <StatTile label="Recently read" value={history.length} />
      </div>

      {/* ---- Main + sidebar ---- */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel title="Saved stories" count={saved.length}>
            {saved.length === 0 ? (
              <Empty>
                Nothing saved yet. Tap <span className="text-text">Save</span> on any story to keep
                it here.
              </Empty>
            ) : (
              <ul className="divide-y divide-border">
                {saved.map((a) => (
                  <StoryRow key={a.id} article={a} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Recently read"
            count={history.length}
            action={history.length > 0 ? <ClearHistoryButton /> : undefined}
          >
            {history.length === 0 ? (
              <Empty>Stories you read while signed in show up here.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {history.map((a) => (
                  <StoryRow key={a.id} article={a} readAt={a.viewedAt} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <Panel title="Following" count={followingCount}>
            <FollowedList sections={follows.sections} topics={follows.topics} />
          </Panel>

          <Panel title="Account &amp; security">
            <Link
              href="/account/security"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-text transition hover:border-primary"
            >
              Two-factor authentication
              <span
                className={`font-mono text-[11px] ${user.twoFactorEnabled ? 'text-accent-green' : 'text-faint'}`}
              >
                {user.twoFactorEnabled ? 'On' : 'Set up'}
              </span>
            </Link>
          </Panel>

          <Panel title="Privacy &amp; data">
            <p className="mb-3 font-body text-sm text-muted">
              Download everything we hold about you, or delete your account (Law N° 058/2021).
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/account/export"
                className="inline-flex w-fit items-center rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
              >
                Download my data
              </a>
              <DeleteAccountForm />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-heading text-3xl font-black text-text">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
    </div>
  );
}

function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {title}
          {count !== undefined && <span className="ml-1.5 text-faint">({count})</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-body text-sm text-muted">{children}</p>;
}

function StoryRow({
  article,
  readAt,
}: {
  article: SavedArticle | HistoryArticle;
  readAt?: string;
}) {
  return (
    <li>
      <Link href={`/article/${article.slug}`} className="group flex gap-3 py-3">
        <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2 ring-1 ring-border">
          {article.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- article images come from arbitrary hosts
            <img src={article.featuredImage.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="media-fill absolute inset-0" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            {article.category.name}
          </span>
          <span className="line-clamp-2 font-heading text-sm font-bold text-text group-hover:text-primary">
            {article.title}
          </span>
          <span className="font-mono text-[11px] text-faint">
            {readAt
              ? `Read ${formatDate(readAt)}`
              : article.publishedAt
                ? formatDate(article.publishedAt)
                : ''}
          </span>
        </span>
      </Link>
    </li>
  );
}
