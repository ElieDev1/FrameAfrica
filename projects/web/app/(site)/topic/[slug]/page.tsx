import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoadMore } from '@/components/LoadMore';
import { fetchArticles, fetchTopic } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await fetchTopic(slug);
  if (!topic) {
    return { title: 'Topic not found' };
  }
  const description = topic.description ?? `The latest on ${topic.name} from Frame Africa.`;
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

  const { articles, pagination } = await fetchArticles({ topic: slug, limit: 12 });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Topic</p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {topic.name}
        </h1>
        {topic.description && (
          <p className="mt-2 max-w-2xl font-body text-muted">{topic.description}</p>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">
          No stories tagged with this topic yet.
        </p>
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
