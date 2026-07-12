import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FollowButton } from '@/components/FollowButton';
import { LoadMore } from '@/components/LoadMore';
import { fetchArticles, fetchTopic } from '@/lib/api';
import { getFollowStatus } from '@/lib/follows-actions';
import { getSession } from '@/lib/session';
import { absoluteUrl } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await fetchTopic(slug);
  if (!topic) {
    return { title: 'Topic not found' };
  }
  const locale = await getLocale();
  const description =
    topic.description ?? `${t(locale, 'common.topic')}: ${topic.name} — Frame Africa.`;
  const path = `/topic/${topic.slug}`;
  return {
    title: topic.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', title: topic.name, description, url: absoluteUrl(path) },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = await fetchTopic(slug);
  if (!topic) {
    notFound();
  }

  const locale = await getLocale();
  const [{ articles, pagination }, user, follow] = await Promise.all([
    fetchArticles({ topic: slug, limit: 12 }),
    getSession(),
    getFollowStatus('topic', topic.id),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'common.topic')}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-4xl font-black tracking-tight text-text">
            {topic.name}
          </h1>
          <FollowButton
            target="topic"
            id={topic.id}
            initialFollowing={follow?.following ?? false}
            signedIn={Boolean(user)}
          />
        </div>
        {topic.description && (
          <p className="mt-2 max-w-2xl font-body text-muted">{topic.description}</p>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'topic.empty')}</p>
      ) : (
        <LoadMore
          initialArticles={articles}
          initialCursor={pagination?.nextCursor ?? null}
          topic={slug}
        />
      )}
    </div>
  );
}
