import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRightIcon } from '@/components/icons';
import { AdSlot } from '@/components/AdSlot';
import { ArticleCard } from '@/components/ArticleCard';
import { FollowButton } from '@/components/FollowButton';
import { JustIn } from '@/components/JustIn';
import { LoadMore } from '@/components/LoadMore';
import { MultimediaHubs } from '@/components/MultimediaHubs';
import { NewsletterBox } from '@/components/NewsletterBox';
import { SectionHeading } from '@/components/SectionHeading';
import { fetchArticles, fetchCategory } from '@/lib/api';
import { getFollowStatus } from '@/lib/follows-actions';
import { getSession } from '@/lib/session';
import { absoluteUrl } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { t, translateCategory } from '@/lib/i18n';
import { MULTIMEDIA_HUBS, MULTIMEDIA_SLUG } from '@/lib/multimedia';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    return { title: 'Section not found' };
  }
  const locale = await getLocale();
  const name = translateCategory(locale, category.slug, category.name);
  const description = category.description ?? `The latest ${name} news from Frame Africa.`;
  const path = `/section/${category.slug}`;
  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', title: name, description, url: absoluteUrl(path) },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    notFound();
  }

  const locale = await getLocale();
  const [{ articles, pagination }, user, follow] = await Promise.all([
    fetchArticles({ category: slug, limit: 12 }),
    getSession(),
    getFollowStatus('section', category.id),
  ]);

  const categoryName = translateCategory(locale, category.slug, category.name);
  // "Multimedia" holds no articles — it's a container for the standalone hubs.
  const isMultimedia = category.slug === MULTIMEDIA_SLUG;

  // The newest story leads the section; the rest fill the small-card grid.
  const lead = articles[0];
  const restArticles = articles.slice(1);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <header className="border-b border-border pb-6">
        {/* Home › [parent section ›] this section. The parent only exists for a
            sub-section; a top-level section is just Home › Name. */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 font-mono text-xs text-muted"
        >
          <Link href="/" className="hover:text-primary">
            {t(locale, 'nav.home')}
          </Link>
          <ChevronRightIcon size={12} className="text-faint" />
          {category.parent && (
            <>
              <Link
                href={`/section/${category.parent.slug}`}
                className="text-primary hover:underline"
              >
                {translateCategory(locale, category.parent.slug, category.parent.name)}
              </Link>
              <ChevronRightIcon size={12} className="text-faint" />
            </>
          )}
          <span aria-current="page" className="text-text">
            {categoryName}
          </span>
        </nav>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-4xl font-black tracking-tight text-text">
            {categoryName}
          </h1>
          <FollowButton
            target="section"
            id={category.id}
            initialFollowing={follow?.following ?? false}
            signedIn={Boolean(user)}
          />
        </div>
        {category.description && (
          <p className="mt-2 max-w-2xl font-body text-muted">{category.description}</p>
        )}

        {isMultimedia ? (
          // Send readers to the hubs, not the (empty) child article sections.
          <nav aria-label="Sub-sections" className="mt-4 flex flex-wrap gap-2">
            {MULTIMEDIA_HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
              >
                {t(locale, hub.nameKey)}
              </Link>
            ))}
          </nav>
        ) : (
          category.children.length > 0 && (
            <nav aria-label="Sub-sections" className="mt-4 flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/section/${child.slug}`}
                  className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
                >
                  {translateCategory(locale, child.slug, child.name)}
                </Link>
              ))}
            </nav>
          )
        )}
      </header>

      {/* Standard top-banner position: directly under the section masthead. */}
      {!isMultimedia && <AdSlot variant="leaderboard" className="mt-6" />}

      {isMultimedia && <MultimediaHubs locale={locale} />}

      {articles.length === 0
        ? !isMultimedia && (
            <p className="py-16 text-center font-body text-muted">{t(locale, 'section.empty')}</p>
          )
        : !isMultimedia && (
            // Editorial layout: a wide lead story, then a dense column of small
            // cards, beside a "Just in" rail showing how recently each story
            // landed — a news page, not a grid of uniform product tiles.
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                {lead && (
                  <div className="border-b border-border pb-8">
                    <ArticleCard article={lead} horizontal locale={locale} />
                  </div>
                )}
                {restArticles.length > 0 && (
                  <div className="mt-8">
                    <SectionHeading title={t(locale, 'home.latest')} />
                    <LoadMore
                      initialArticles={restArticles}
                      initialCursor={pagination?.nextCursor ?? null}
                      category={slug}
                      compact
                    />
                  </div>
                )}
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
