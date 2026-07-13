import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleShareRail } from '@/components/ArticleShareRail';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { CommentsSection } from '@/components/CommentsSection';
import { MostRead } from '@/components/HeadlineList';
import { ChevronRightIcon, ClockIcon } from '@/components/icons';
import { SectionHeading } from '@/components/SectionHeading';
import { LikeButton } from '@/components/LikeButton';
import { LiveFeed } from '@/components/LiveFeed';
import { NewsletterBox } from '@/components/NewsletterBox';
import { ReadingProgress } from '@/components/ReadingProgress';
import { RecordView } from '@/components/RecordView';
import { TrackView } from '@/components/TrackView';
import { SaveButton } from '@/components/SaveButton';
import { ShareBar } from '@/components/ShareBar';
import { StickyShare } from '@/components/StickyShare';
import { getBookmarkStatus } from '@/lib/bookmarks-actions';
import { getLikeStatus } from '@/lib/likes-actions';
import {
  fetchArticle,
  fetchArticles,
  fetchComments,
  fetchLiveUpdates,
  fetchRelated,
  type ArticleDetail,
  type ArticleSummary,
} from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getAccessToken, getSession } from '@/lib/session';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { type Locale, t, translateCategory } from '@/lib/i18n';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: 'Article not found' };
  }
  const locale = await getLocale();
  const catName = translateCategory(locale, article.category.slug, article.category.name);
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
      section: catName,
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
function newsArticleJsonLd(article: ArticleDetail, locale: Locale): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt ?? article.subtitle ?? undefined,
    articleSection: translateCategory(locale, article.category.slug, article.category.name),
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

  // Reader identity for the paywall: an opaque device key + the signed-in
  // reader's token (so a subscription unlocks the story).
  const [jar, accessToken, locale] = await Promise.all([cookies(), getAccessToken(), getLocale()]);
  const article = await fetchArticle(slug, {
    readerKey: jar.get('fa_reader')?.value,
    accessToken: accessToken ?? undefined,
  });
  if (!article) {
    notFound();
  }

  const [related, comments, user, likeStatus, liveUpdates, bookmark, popularRes] =
    await Promise.all([
      fetchRelated(slug),
      fetchComments(article.id),
      getSession(),
      getLikeStatus(article.id),
      fetchLiveUpdates(slug),
      getBookmarkStatus(article.id),
      fetchArticles({ sort: 'popular', limit: 5 }).catch(() => ({
        articles: [] as ArticleSummary[],
      })),
    ]);
  const popular = popularRes.articles.filter((a) => a.id !== article.id).slice(0, 5);

  const updated = isMeaningfullyUpdated(article.publishedAt, article.updatedAt);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <ReadingProgress />
      <RecordView articleId={article.id} signedIn={Boolean(user)} />
      <TrackView articleId={article.id} />
      <StickyShare title={article.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: newsArticleJsonLd(article, locale) }}
      />

      <div className="lg:grid lg:grid-cols-[3rem_minmax(0,1fr)_18rem] lg:gap-8 xl:grid-cols-[3rem_minmax(0,52rem)_minmax(18rem,1fr)] xl:gap-12">
        {/* Left: sticky vertical share rail (fills the left margin) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ArticleShareRail title={article.title} />
          </div>
        </aside>

        {/* Center: the reading column */}
        <article className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1 font-mono text-xs text-muted"
          >
            <Link href="/" className="hover:text-primary">
              {t(locale, 'nav.home')}
            </Link>
            <ChevronRightIcon size={12} className="text-faint" />
            <Link
              href={`/section/${article.category.slug}`}
              className="text-primary hover:underline"
            >
              {translateCategory(locale, article.category.slug, article.category.name)}
            </Link>
          </nav>

          <div className="mb-3 flex items-center gap-2">
            <Link
              href={`/section/${article.category.slug}`}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary hover:underline"
            >
              {translateCategory(locale, article.category.slug, article.category.name)}
            </Link>
            {article.isLive && (
              <span className="inline-flex items-center gap-1 rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
                {t(locale, 'article.live')}
              </span>
            )}
            {article.isBreaking && !article.isLive && (
              <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
                {t(locale, 'home.breaking')}
              </span>
            )}
            {article.isPremium && (
              <span className="rounded bg-accent-yellow px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-black">
                {t(locale, 'article.premium')}
              </span>
            )}
          </div>

          <h1 className="font-heading text-2xl font-black leading-[1.12] tracking-tight text-text md:text-3xl">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="mt-3 font-body text-base leading-relaxed text-muted">
              {article.subtitle}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted">
            <span className="text-text">{article.author.displayName}</span>
            {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
            {article.readTimeMin && (
              <span className="inline-flex items-center gap-1">
                · <ClockIcon size={12} /> {article.readTimeMin} {t(locale, 'article.minRead')}
              </span>
            )}
            {updated && (
              <span className="text-primary">
                · {t(locale, 'article.updated')} {formatDate(article.updatedAt)}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LikeButton
              articleId={article.id}
              initialLiked={likeStatus?.liked ?? false}
              initialCount={likeStatus?.likeCount ?? article.likeCount}
              signedIn={Boolean(user)}
            />
            <SaveButton
              articleId={article.id}
              initialSaved={bookmark?.saved ?? false}
              signedIn={Boolean(user)}
            />
            <ShareBar title={article.title} />
          </div>

          {article.corrections.length > 0 && (
            <aside
              aria-label="Corrections"
              className="mt-6 rounded-xl border-l-4 border-accent-yellow bg-surface px-4 py-3"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-yellow">
                {article.corrections.length === 1
                  ? t(locale, 'article.correction')
                  : t(locale, 'footer.corrections')}
              </p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {article.corrections.map((correction) => (
                  <li key={correction.id} className="font-body text-sm leading-relaxed text-muted">
                    <span className="text-faint">{formatDate(correction.createdAt)}: </span>
                    {correction.note}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {article.featuredImage ? (
            <figure className="mt-6">
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl ring-1 ring-border">
                <Image
                  src={article.featuredImage.url}
                  alt={article.featuredImage.alt ?? ''}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 832px"
                  className="object-cover"
                />
              </div>
              {article.featuredImage.credit && (
                <figcaption className="mt-2 font-mono text-[11px] text-faint">
                  {t(locale, 'article.photoCredit')}: {article.featuredImage.credit}
                </figcaption>
              )}
            </figure>
          ) : (
            <div
              className="media-fill mt-6 aspect-[21/9] w-full rounded-2xl ring-1 ring-border"
              aria-hidden
            >
              <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text/70">
                {translateCategory(locale, article.category.slug, article.category.name)}
              </span>
            </div>
          )}

          {(article.isLive || liveUpdates.length > 0) && (
            <LiveFeed slug={article.slug} initialUpdates={liveUpdates} live={article.isLive} />
          )}

          <div className="mt-8">
            <BlockRenderer blocks={article.blocks} />
          </div>

          {article.topics.length > 0 && (
            <nav
              aria-label={t(locale, 'article.topics')}
              className="mt-10 flex flex-wrap items-center gap-2"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                {t(locale, 'article.topics')}
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
                {t(locale, 'article.premiumStory')}
              </span>
              <p className="font-heading text-xl font-bold text-text">
                {t(locale, 'article.subscribeKeepReading')}
              </p>
              <p className="max-w-sm font-body text-sm text-muted">
                {t(locale, 'article.lockedBody')}
              </p>
              {/* The paywall finally has a way through it. */}
              <Link
                href="/pricing"
                className="mt-2 rounded-lg bg-primary px-5 py-2.5 font-heading font-bold text-black transition hover:opacity-90"
              >
                {t(locale, 'pay.seePlans')}
              </Link>
            </div>
          )}

          {related.length > 0 && (
            <section
              aria-label={t(locale, 'article.related')}
              className="mt-12 border-t border-border pt-8"
            >
              <SectionHeading title={t(locale, 'article.related')} />
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {related.map((item) => (
                  <ArticleCard key={item.id} article={item} locale={locale} />
                ))}
              </div>
            </section>
          )}

          <CommentsSection
            targetType="article"
            targetId={article.id}
            path={`/article/${article.slug}`}
            comments={comments}
            signedIn={Boolean(user)}
            locale={locale}
          />

          <div className="mt-10 border-t border-border pt-6">
            <Link href="/" className="font-mono text-xs text-primary hover:underline">
              ← {t(locale, 'common.backToHome').replace(' →', '')}
            </Link>
          </div>
        </article>

        {/* Right sidebar — fills the margin on wide screens; on mobile it stacks
            below the article so readers still get Most-read + newsletter. */}
        <aside className="mt-10 border-t border-border pt-8 lg:mt-0 lg:border-0 lg:pt-0">
          <div className="space-y-8 lg:sticky lg:top-24">
            {popular.length > 0 && <MostRead articles={popular} locale={locale} />}
            <NewsletterBox />
            {/* The tall half-page ad is desktop-only; mobile keeps a compact slot. */}
            <div className="hidden lg:block">
              <AdSlot variant="halfpage" />
            </div>
            <div className="lg:hidden">
              <AdSlot variant="native" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
