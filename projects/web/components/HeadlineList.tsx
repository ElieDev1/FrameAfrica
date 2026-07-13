import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';
import { newsTime } from '@/lib/format';
import { RailHeading } from './SectionHeading';
import { type Locale, t, translateCategory } from '@/lib/i18n';

/** A compact, imageless headline (for secondary stories and curated lists). */
export function HeadlineItem({
  article,
  rank,
  locale,
}: {
  article: ArticleSummary;
  rank?: number;
  locale?: Locale;
}) {
  return (
    <article className="group flex gap-3 py-3">
      {rank !== undefined && (
        <span
          className={`font-heading text-2xl font-black leading-none tabular-nums ${
            rank <= 3 ? 'text-primary' : 'text-faint/50'
          }`}
        >
          {String(rank).padStart(2, '0')}
        </span>
      )}
      <div className="min-w-0">
        <span className="flex items-baseline gap-2">
          <Link
            href={`/section/${article.category.slug}`}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
          >
            {locale
              ? translateCategory(locale, article.category.slug, article.category.name)
              : article.category.name}
          </Link>
          {article.publishedAt && (
            <time dateTime={article.publishedAt} className="font-mono text-[10px] text-faint">
              {newsTime(article.publishedAt, locale)}
            </time>
          )}
        </span>
        <h3 className="mt-0.5 font-heading text-[15px] font-bold leading-snug text-text">
          <Link
            href={`/article/${article.slug}`}
            className="line-clamp-2 transition-colors group-hover:text-primary"
          >
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

/** The sidebar "Most read" ranked list — shares the section connector heading. */
export function MostRead({ articles, locale }: { articles: ArticleSummary[]; locale?: Locale }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="most-read">
      <RailHeading title={locale ? t(locale, 'home.mostRead') : 'Most read'} id="most-read" />
      <div className="divide-y divide-border">
        {articles.map((article, index) => (
          <HeadlineItem key={article.id} article={article} rank={index + 1} locale={locale} />
        ))}
      </div>
    </section>
  );
}
