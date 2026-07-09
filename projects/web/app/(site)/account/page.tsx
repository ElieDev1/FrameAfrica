import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClearHistoryButton } from '@/components/account/ClearHistoryButton';
import { FollowedList } from '@/components/account/FollowedList';
import { logout } from '@/lib/auth-actions';
import { fetchSaved } from '@/lib/bookmarks-actions';
import { fetchFollows } from '@/lib/follows-actions';
import { formatDate } from '@/lib/format';
import { fetchHistory } from '@/lib/history-actions';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Your account — Frame Africa' };

const STAFF_ROLES = ['journalist', 'editor', 'admin'];

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Your account</h1>

      <dl className="mt-8 divide-y divide-border rounded-xl border border-border">
        <Row label="Name" value={user.displayName} />
        <Row label="Email" value={user.email} />
        <Row label="Roles" value={user.roles.join(', ') || 'reader'} />
      </dl>

      {isStaff && (
        <Link
          href="/dashboard"
          className="mt-8 inline-block font-mono text-sm text-primary hover:underline"
        >
          Go to the newsroom →
        </Link>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Following ({follows.sections.length + follows.topics.length})
        </h2>
        <FollowedList sections={follows.sections} topics={follows.topics} />
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Saved stories ({saved.length})
        </h2>
        {saved.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted">
            Nothing saved yet. Tap <span className="text-text">Save</span> on any story to keep it
            here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {saved.map((article) => (
              <li key={article.id} className="px-4 py-3">
                <Link href={`/article/${article.slug}`} className="group block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                    {article.category.name}
                  </span>
                  <p className="font-heading font-bold text-text group-hover:text-primary">
                    {article.title}
                  </p>
                  {article.publishedAt && (
                    <span className="font-mono text-[11px] text-faint">
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Recently read ({history.length})
          </h2>
          {history.length > 0 && <ClearHistoryButton />}
        </div>
        {history.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted">
            Stories you read while signed in show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {history.map((article) => (
              <li key={article.id} className="px-4 py-3">
                <Link href={`/article/${article.slug}`} className="group block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                    {article.category.name}
                  </span>
                  <p className="font-heading font-bold text-text group-hover:text-primary">
                    {article.title}
                  </p>
                  <span className="font-mono text-[11px] text-faint">
                    Read {formatDate(article.viewedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={logout} className="mt-8 border-t border-border pt-6">
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-accent-red hover:text-accent-red"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="font-body text-text">{value}</dd>
    </div>
  );
}
