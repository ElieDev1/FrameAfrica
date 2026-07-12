import Image from 'next/image';
import Link from 'next/link';
import { ClockIcon } from '@/components/icons';
import type { ArticleSummary } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { type Locale, t, translateCategory } from '@/lib/i18n';

function Kicker({
  article,
  small = false,
  locale,
}: {
  article: ArticleSummary;
  small?: boolean;
  locale?: Locale;
}) {
  return (
    <span className="flex items-center gap-2">
      <Link
        href={`/section/${article.category.slug}`}
        className={`font-mono uppercase tracking-[0.14em] text-primary hover:underline ${
          small ? 'text-[9px]' : 'text-[10px]'
        }`}
      >
        {locale
          ? translateCategory(locale, article.category.slug, article.category.name)
          : article.category.name}
      </Link>
      {article.isBreaking && (
        <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-white">
          {locale ? t(locale, 'home.breaking') : 'Breaking'}
        </span>
      )}
    </span>
  );
}

function Meta({ article, locale }: { article: ArticleSummary; locale?: Locale }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] text-muted">
      {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
      {article.readTimeMin && (
        <span className="inline-flex items-center gap-1">
          · <ClockIcon size={11} /> {article.readTimeMin} {locale ? t(locale, 'common.min') : 'min'}
        </span>
      )}
    </p>
  );
}

/**
 * The hero's secondary column: a lead item with a wide image, then compact
 * thumbnail rows. Fills the space beside the front-page lead with real
 * hierarchy instead of a flat list of headlines.
 */
export function HeroSidebar({ articles, locale }: { articles: ArticleSummary[]; locale?: Locale }) {
  if (articles.length === 0) return null;
  const [top, ...rows] = articles;

  return (
    <div className="lg:border-l lg:border-border lg:pl-8">
      <h2 className="flex items-center gap-2 border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        <span className="h-3.5 w-1 rounded-full bg-primary" />
        {locale ? t(locale, 'home.topStories') : 'Top stories'}
      </h2>

      {/* Lead secondary story — image on top */}
      <article className="group border-b border-border py-4">
        <Link
          href={`/article/${top.slug}`}
          className="relative block aspect-[16/9] w-full overflow-hidden ring-1 ring-border"
        >
          {top.featuredImage ? (
            <Image
              src={top.featuredImage.url}
              alt={top.featuredImage.alt ?? ''}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="media-fill absolute inset-0" aria-hidden />
          )}
        </Link>
        <div className="mt-3 flex flex-col gap-1.5">
          <Kicker article={top} locale={locale} />
          <h3 className="font-heading text-xl font-bold leading-tight tracking-tight text-text">
            <Link
              href={`/article/${top.slug}`}
              className="transition-colors group-hover:text-primary"
            >
              {top.title}
            </Link>
          </h3>
          <Meta article={top} locale={locale} />
        </div>
      </article>

      {/* Remaining stories — compact thumbnail rows */}
      <div className="divide-y divide-border">
        {rows.map((article) => (
          <article key={article.id} className="group flex gap-4 py-4">
            <Link
              href={`/article/${article.slug}`}
              className="relative aspect-square w-[4.5rem] shrink-0 overflow-hidden ring-1 ring-border"
            >
              {article.featuredImage ? (
                <Image
                  src={article.featuredImage.url}
                  alt={article.featuredImage.alt ?? ''}
                  fill
                  sizes="72px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="media-fill absolute inset-0" aria-hidden />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Kicker article={article} small locale={locale} />
              <h3 className="mt-1 font-heading text-[15px] font-bold leading-snug text-text">
                <Link
                  href={`/article/${article.slug}`}
                  className="line-clamp-3 transition-colors group-hover:text-primary"
                >
                  {article.title}
                </Link>
              </h3>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
