import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClearHistoryButton } from '@/components/account/ClearHistoryButton';
import { DeleteAccountForm } from '@/components/account/DeleteAccountForm';
import { EditProfileForm } from '@/components/account/EditProfileForm';
import { FollowedList } from '@/components/account/FollowedList';
import { CheckIcon } from '@/components/icons';
import type { SavedArticle } from '@/lib/api';
import { logout } from '@/lib/auth-actions';
import { fetchSaved } from '@/lib/bookmarks-actions';
import { fetchFollows } from '@/lib/follows-actions';
import { formatDate } from '@/lib/format';
import { fetchHistory, type HistoryArticle } from '@/lib/history-actions';
import { getSession } from '@/lib/session';

import { getLocale } from '@/lib/i18n-server';
import { type Locale, type MessageKey, t, translateCategory } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'dash.myAccount')} — Frame Africa` };
}

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

  const locale = await getLocale();
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
          {/* The avatar carries a brand-coloured "verified member" badge in its
              corner — the way Google/Twitter mark a status on the picture itself. */}
          <div className="relative shrink-0">
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
            {user.isSubscriber && (
              <span
                title={t(locale, 'account.member')}
                aria-label={t(locale, 'account.member')}
                className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary text-black ring-2 ring-surface"
              >
                <CheckIcon size={13} aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-black tracking-tight text-text">
              {user.displayName}
            </h1>
            <p className="truncate font-body text-sm text-muted">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {(user.roles.length ? user.roles : ['reader']).map((r) => {
                const roleKey = `role.${r}` as MessageKey;
                return (
                  <span
                    key={r}
                    className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                  >
                    {t(locale, roleKey)}
                  </span>
                );
              })}
              {user.isSubscriber && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                  <CheckIcon size={11} aria-hidden /> {t(locale, 'account.member')}
                </span>
              )}
              {user.twoFactorEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-green">
                  <CheckIcon size={11} aria-hidden /> {t(locale, 'account.twoFactorOn')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <EditProfileForm
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            // The byline fields are only meaningful for someone who writes.
            byline={
              isStaff
                ? {
                    bio: user.bio ?? '',
                    jobTitle: user.jobTitle ?? '',
                    slug: user.authorSlug ?? null,
                  }
                : undefined
            }
          />
          <Link
            href="/for-you"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            {t(locale, 'nav.forYou')}
          </Link>
          {isStaff && (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
            >
              {t(locale, 'nav.newsroomDashboard').split(' ')[0] || 'Newsroom'}
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent-red hover:text-accent-red"
            >
              {t(locale, 'nav.signOut')}
            </button>
          </form>
        </div>
      </section>

      {/* ---- Stats ---- */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatTile label={t(locale, 'account.following')} value={followingCount} />
        <StatTile label={t(locale, 'account.saved')} value={saved.length} />
        <StatTile label={t(locale, 'account.recentlyRead')} value={history.length} />
      </div>

      {/* ---- Main + sidebar ---- */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel title={t(locale, 'nav.savedStories')} count={saved.length}>
            {saved.length === 0 ? (
              <Empty>{t(locale, 'account.emptySaved')}</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {saved.map((a) => (
                  <StoryRow key={a.id} article={a} locale={locale} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={t(locale, 'account.recentlyRead')}
            count={history.length}
            action={history.length > 0 ? <ClearHistoryButton /> : undefined}
          >
            {history.length === 0 ? (
              <Empty>{t(locale, 'account.emptyHistory')}</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {history.map((a) => (
                  <StoryRow key={a.id} article={a} readAt={a.viewedAt} locale={locale} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <Panel title={t(locale, 'account.following')} count={followingCount}>
            <FollowedList sections={follows.sections} topics={follows.topics} />
          </Panel>

          <Panel title={t(locale, 'account.membership')}>
            <Link
              href="/account/billing"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-text transition hover:border-primary"
            >
              <span>
                {user.isSubscriber
                  ? t(locale, 'account.memberActive')
                  : t(locale, 'account.notMember')}
                {user.isSubscriber && user.subscribedUntil && (
                  <span className="mt-0.5 block font-mono text-[11px] text-faint">
                    {t(locale, 'account.renewsOn')} {formatDate(user.subscribedUntil, locale)}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-primary">
                {user.isSubscriber ? t(locale, 'account.manage') : t(locale, 'pay.seePlans')}
              </span>
            </Link>
          </Panel>

          <Panel title={t(locale, 'nav.accountSecurity')}>
            <Link
              href="/account/security"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-text transition hover:border-primary"
            >
              {t(locale, 'account.twoFactorAuth')}
              <span
                className={`font-mono text-[11px] ${user.twoFactorEnabled ? 'text-accent-green' : 'text-faint'}`}
              >
                {user.twoFactorEnabled
                  ? t(locale, 'account.twoFactorOn')
                  : t(locale, 'account.twoFactorSetUp')}
              </span>
            </Link>
          </Panel>

          <Panel title={t(locale, 'account.privacyAndData')}>
            <p className="mb-3 font-body text-sm text-muted">{t(locale, 'account.privacyDesc')}</p>
            <div className="flex flex-col gap-3">
              <a
                href="/account/export"
                className="inline-flex w-fit items-center rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
              >
                {t(locale, 'account.downloadData')}
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
  locale,
}: {
  article: SavedArticle | HistoryArticle;
  readAt?: string;
  locale: Locale;
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
            {translateCategory(locale, article.category.slug, article.category.name)}
          </span>
          <span className="line-clamp-2 font-heading text-sm font-bold text-text group-hover:text-primary">
            {article.title}
          </span>
          <span className="font-mono text-[11px] text-faint">
            {readAt
              ? t(locale, 'account.readAt').replace('{date}', formatDate(readAt))
              : article.publishedAt
                ? formatDate(article.publishedAt)
                : ''}
          </span>
        </span>
      </Link>
    </li>
  );
}
