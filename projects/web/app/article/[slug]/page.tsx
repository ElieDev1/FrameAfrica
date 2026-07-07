import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { CommentsSection } from '@/components/CommentsSection';
import { ReadingProgress } from '@/components/ReadingProgress';
import { ShareBar } from '@/components/ShareBar';
import { StickyShare } from '@/components/StickyShare';
import { fetchArticle, fetchComments, fetchRelated, type ArticleDetail } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getSession } from '@/lib/session';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: 'Article not found' };
  }
  const description = article.excerpt ?? article.subtitle ?? undefined;
  const path = `/article/${article.slug}`;
  const images = article.featuredImage ? [{ url: article.featuredImage.url }] : undefined;
  return {
    title: article.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: absoluteUrl(path),
      section: article.category.name,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: [article.author.displayName],
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images,
    },
  };
}

/**
 * True when a story was edited a meaningful time after publishing (>5 min), so
 * we only surface an "Updated" stamp for genuine post-publish revisions, not the
 * save that published it.
 */
function isMeaningfullyUpdated(publishedAt: string | null, updatedAt: string): boolean {
  if (!publishedAt) return false;
  return new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 5 * 60 * 1000;
}

/** schema.org NewsArticle structured data (documents/01 §4.8, SEO). */
function newsArticleJsonLd(article: ArticleDetail): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt ?? article.subtitle ?? undefined,
    articleSection: article.category.name,
    inLanguage: article.language,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author: { '@type': 'Person', name: article.author.displayName },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    image: article.featuredImage ? [absoluteUrl(article.featuredImage.url)] : undefined,
    mainEntityOfPage: absoluteUrl(`/article/${article.slug}`),
    isAccessibleForFree: !article.isPremium,
  };
  return JSON.stringify(data);
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    notFound();
  }

  const [related, comments, user] = await Promise.all([
    fetchRelated(slug),
    fetchComments(article.id),
    getSession(),
  ]);

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <ReadingProgress />
      <StickyShare title={article.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: newsArticleJsonLd(article) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 font-mono text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden> › </span>
        <Link href={`/section/${article.category.slug}`} className="text-primary hover:underline">
          {article.category.name}
        </Link>
      </nav>

      <div className="mb-3 flex items-center gap-2">
        <Link
          href={`/section/${article.category.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary hover:underline"
        >
          {article.category.name}
        </Link>
        {article.isBreaking && (
          <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
            Breaking
          </span>
        )}
        {article.isPremium && (
          <span className="rounded bg-accent-yellow px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-black">
            Premium
          </span>
        )}
      </div>

      <h1 className="font-heading text-4xl font-black leading-[1.08] tracking-tight text-text md:text-5xl">
        {article.title}
      </h1>

      {article.subtitle && (
        <p className="mt-4 font-body text-xl leading-relaxed text-muted">{article.subtitle}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted">
        <span className="text-text">{article.author.displayName}</span>
        {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
        {article.readTimeMin && <span>· {article.readTimeMin} min read</span>}
        {updated && <span className="text-primary">· Updated {formatDate(article.updatedAt)}</span>}
      </div>

      <div className="mt-5">
        <ShareBar title={article.title} />
      </div>

      {article.featuredImage ? (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-border">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alt ?? ''}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 680px"
              className="object-cover"
            />
          </div>
          {article.featuredImage.credit && (
            <figcaption className="mt-2 font-mono text-[11px] text-faint">
              Photo: {article.featuredImage.credit}
            </figcaption>
          )}
        </figure>
      ) : (
        <div
          className="media-fill mt-8 aspect-[16/9] w-full rounded-2xl ring-1 ring-border"
          aria-hidden
        >
          <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text/70">
            {article.category.name}
          </span>
        </div>
      )}

      <div className="mt-8">
        <BlockRenderer blocks={article.blocks} />
      </div>

      {article.topics.length > 0 && (
        <nav aria-label="Topics" className="mt-10 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            Topics
          </span>
          {article.topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topic/${topic.slug}`}
              className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted transition hover:border-primary hover:text-primary"
            >
              {topic.name}
            </Link>
          ))}
        </nav>
      )}

      {article.isLocked && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border-2 bg-surface px-6 py-10 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Premium story
          </span>
          <p className="font-heading text-xl font-bold text-text">Subscribe to keep reading</p>
          <p className="max-w-sm font-body text-sm text-muted">
            This story is available to Frame Africa subscribers. Plans and payment (MoMo, Airtel
            Money, card) are coming soon.
          </p>
        </div>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12 border-t border-border pt-8">
          <h2
            id="related"
            className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted"
          >
            Related stories
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      )}

      <CommentsSection
        articleId={article.id}
        slug={article.slug}
        comments={comments}
        signedIn={Boolean(user)}
      />

      <div className="mt-10 border-t border-border pt-6">
        <Link href="/" className="font-mono text-xs text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
