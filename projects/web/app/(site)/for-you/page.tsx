import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SparklesIcon } from '@/components/icons';
import { LoadMore } from '@/components/LoadMore';
import { fetchFeed } from '@/lib/feed-actions';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'For You',
  description: 'Your personalised feed, built from the sections and topics you follow.',
  robots: { index: false }, // a per-reader page — not for search indexing
};

export default async function ForYouPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login?next=/for-you');
  }

  const { articles, nextCursor, personalized } = await fetchFeed({ limit: 12 });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-primary">
          <SparklesIcon size={14} aria-hidden />
          For You
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {user.displayName.split(' ')[0]}&apos;s feed
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">
          {personalized
            ? 'Stories from the sections and topics you follow, and what you read most.'
            : 'The latest news for now — follow sections and topics to personalise this feed.'}
        </p>
      </header>

      {!personalized && (
        <div className="mt-6 rounded-xl border border-border bg-surface-2 px-4 py-4">
          <p className="font-body text-sm text-muted">
            Tap <span className="font-semibold text-text">Follow</span> on any{' '}
            <Link href="/" className="text-primary hover:underline">
              section
            </Link>{' '}
            or topic and it&apos;ll shape this feed. Manage who you follow from your{' '}
            <Link href="/account" className="text-primary hover:underline">
              account
            </Link>
            .
          </p>
        </div>
      )}

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">
          Nothing here yet. Follow a few sections or topics to fill your feed.
        </p>
      ) : (
        <LoadMore initialArticles={articles} initialCursor={nextCursor} feed />
      )}
    </div>
  );
}
