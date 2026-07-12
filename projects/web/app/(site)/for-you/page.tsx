import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SparklesIcon } from '@/components/icons';
import { LoadMore } from '@/components/LoadMore';
import { fetchFeed } from '@/lib/feed-actions';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, 'nav.forYou'),
    description: t(locale, 'foryou.metaDesc'),
    robots: { index: false },
  };
}

export default async function ForYouPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login?next=/for-you');
  }

  const locale = await getLocale();
  const { articles, nextCursor, personalized } = await fetchFeed({ limit: 12 });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-primary">
          <SparklesIcon size={14} aria-hidden />
          {t(locale, 'nav.forYou')}
        </p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'foryou.feedTitle').replace('{name}', user.displayName.split(' ')[0])}
        </h1>
        <p className="mt-2 max-w-2xl font-body text-muted">
          {personalized ? t(locale, 'foryou.personalizedDesc') : t(locale, 'foryou.fallbackDesc')}
        </p>
      </header>

      {!personalized && (
        <div className="mt-6 rounded-xl border border-border bg-surface-2 px-4 py-4">
          <p className="font-body text-sm text-muted">
            {t(locale, 'foryou.followPrompt.tap')}
            <span className="font-semibold text-text">
              {t(locale, 'foryou.followPrompt.follow')}
            </span>
            {t(locale, 'foryou.followPrompt.onAny')}
            <Link href="/" className="text-primary hover:underline">
              {t(locale, 'foryou.followPrompt.section')}
            </Link>
            {t(locale, 'foryou.followPrompt.orTopic')}
            <Link href="/account" className="text-primary hover:underline">
              {t(locale, 'foryou.followPrompt.account')}
            </Link>
            .
          </p>
        </div>
      )}

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'foryou.empty')}</p>
      ) : (
        <LoadMore initialArticles={articles} initialCursor={nextCursor} feed />
      )}
    </div>
  );
}
