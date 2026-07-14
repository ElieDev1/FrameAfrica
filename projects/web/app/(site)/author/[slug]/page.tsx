import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { JustIn } from '@/components/JustIn';
import { LoadMore } from '@/components/LoadMore';
import { NewsletterBox } from '@/components/NewsletterBox';
import { SectionHeading } from '@/components/SectionHeading';
import { fetchArticles, fetchAuthor } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await fetchAuthor(slug);
  if (!author) return { title: 'Author not found' };

  const description = author.bio ?? `Stories by ${author.displayName} — Frame Africa.`;
  const path = `/author/${author.slug}`;
  return {
    title: author.displayName,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'profile',
      title: author.displayName,
      description,
      url: absoluteUrl(path),
    },
  };
}

/** The first letter of the name, when there is no photo. */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * A byline is a promise about who stands behind a story, so it has to lead
 * somewhere. This is that page: who the journalist is, and everything they have
 * published, newest first.
 */
export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await fetchAuthor(slug);
  if (!author) notFound();

  const locale = await getLocale();
  const { articles, pagination } = await fetchArticles({ author: slug, limit: 12 });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.displayName,
    jobTitle: author.jobTitle ?? undefined,
    description: author.bio ?? undefined,
    image: author.avatarUrl ?? undefined,
    url: absoluteUrl(`/author/${author.slug}`),
    worksFor: { '@type': 'NewsMediaOrganization', name: 'Frame Africa' },
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <script
        type="application/ld+json"
        // Server-rendered from our own API, and JSON.stringify escapes the payload.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex flex-wrap items-start gap-5 border-b border-border pb-6">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- author photos come from arbitrary hosts
          <img
            src={author.avatarUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-surface-2 font-heading text-2xl font-black text-muted ring-1 ring-border"
          >
            {initial(author.displayName)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            {t(locale, 'author.kicker')}
          </p>
          <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
            {author.displayName}
          </h1>
          {author.jobTitle && (
            <p className="mt-1 font-body text-sm text-muted">{author.jobTitle}</p>
          )}
          {author.bio && (
            <p className="mt-3 max-w-2xl font-body leading-relaxed text-muted">{author.bio}</p>
          )}
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            {author.articleCount} {t(locale, 'author.stories')}
            {author.lastPublishedAt && (
              <>
                {' '}
                · {t(locale, 'author.lastStory')} {formatDate(author.lastPublishedAt, locale)}
              </>
            )}
          </p>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">{t(locale, 'author.empty')}</p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <SectionHeading title={t(locale, 'author.byline')} />
            <LoadMore
              initialArticles={articles}
              initialCursor={pagination?.nextCursor ?? null}
              author={slug}
              compact
            />
          </div>
          <aside className="flex flex-col gap-8">
            <JustIn articles={articles.slice(0, 7)} locale={locale} />
            <AdSlot variant="halfpage" sticky desktopOnly />
            <NewsletterBox />
          </aside>
        </div>
      )}
    </div>
  );
}
