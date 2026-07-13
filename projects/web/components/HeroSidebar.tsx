import Image from 'next/image';
import Link from 'next/link';
import { LiveBadge } from '@/components/ArticleCard';
import { ClockIcon } from '@/components/icons';
import type { ArticleSummary } from '@/lib/api';
import { newsTime } from '@/lib/format';
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
      {article.isLive && <LiveBadge locale={locale} />}
      {article.isBreaking && !article.isLive && (
        <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-white">
          {locale ? t(locale, 'home.breaking') : 'Breaking'}
        </span>
      )}
      {small && article.publishedAt && (
        <span className="font-mono text-[10px] normal-case tracking-normal text-faint">
          {newsTime(article.publishedAt, locale)}
        </span>
      )}
    </span>
  );
}

function Meta({ article, locale }: { article: ArticleSummary; locale?: Locale }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] text-muted">
      {article.publishedAt && <span>{newsTime(article.publishedAt, locale)}</span>}
      {article.readTimeMin && (
        <span className="inline-flex items-center gap-1">
          · <ClockIcon size={11} /> {article.readTimeMin} {locale ? t(locale, 'common.min') : 'min'}
        </span>
      )}
    </p>
  );
}

/**
 * The hero's secondary column: one lead item carries a wide image, and every
 * story below it is headline-only (no photo) — a single photo anchors the
 * column and the rest read as a clean list, the way a print front page runs its
 * "more top stories".
 */
export function HeroSidebar({ articles, locale }: { articles: ArticleSummary[]; locale?: Locale }) {
  if (articles.length === 0) return null;
  const [top, ...rows] = articles;

  return (
    <div className="lg:border-l lg:border-border lg:pl-8">
      <h2 className="flex items-center gap-2 border-b border-border pb-2.5 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        <span className="h-3.5 w-1 rounded-full bg-primary" />
        {locale ? t(locale, 'home.topStories') : 'Top stories'}
      </h2>

      {/* Lead secondary story — image on top (kept shallow so the column stays compact) */}
      <article className="group border-b border-border py-3">
        <Link
          href={`/article/${top.slug}`}
          className="relative block aspect-[2/1] w-full overflow-hidden ring-1 ring-border"
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
        <div className="mt-2.5 flex flex-col gap-1">
          <Kicker article={top} locale={locale} />
          <h3 className="font-heading text-lg font-bold leading-tight tracking-tight text-text">
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

      {/* Remaining stories — headline-only, no photo */}
      <div className="divide-y divide-border">
        {rows.map((article) => (
          <article key={article.id} className="group py-3">
            <Kicker article={article} small locale={locale} />
            <h3 className="mt-1 font-heading text-[15px] font-bold leading-snug text-text">
              <Link
                href={`/article/${article.slug}`}
                className="line-clamp-3 transition-colors group-hover:text-primary"
              >
                {article.title}
              </Link>
            </h3>
          </article>
        ))}
      </div>
    </div>
  );
}
