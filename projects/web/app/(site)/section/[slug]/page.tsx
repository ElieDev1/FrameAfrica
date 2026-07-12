import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRightIcon } from '@/components/icons';
import { FollowButton } from '@/components/FollowButton';
import { LoadMore } from '@/components/LoadMore';
import { MultimediaHubs } from '@/components/MultimediaHubs';
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

      {isMultimedia && <MultimediaHubs locale={locale} />}

      {articles.length === 0 ? (
        !isMultimedia && (
          <p className="py-16 text-center font-body text-muted">{t(locale, 'section.empty')}</p>
        )
      ) : (
        <div className={isMultimedia ? 'mt-12' : undefined}>
          <LoadMore
            initialArticles={articles}
            initialCursor={pagination?.nextCursor ?? null}
            category={slug}
          />
        </div>
      )}
    </div>
  );
}
