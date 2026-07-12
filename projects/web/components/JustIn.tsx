import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { type Locale, t, translateCategory } from '@/lib/i18n';
import { RailHeading } from './SectionHeading';

/**
 * A chronological "Just in" rail — the newest stories in the order they were
 * released, as a text-only timeline (no images): a connector line with a hollow
 * dot per story, the relative time, its section, and the headline. Used in the
 * homepage sidebar in place of a popularity list.
 */
export function JustIn({ articles, locale }: { articles: ArticleSummary[]; locale?: Locale }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="just-in">
      <RailHeading title={locale ? t(locale, 'home.justIn') : 'Just in'} id="just-in" />
      <ol className="relative">
        {articles.map((article) => (
          <li
            key={article.id}
            className="group relative border-l border-border pb-5 pl-5 last:pb-0"
          >
            {/* Timeline node, centred on the connector line. */}
            <span
              aria-hidden
              className="absolute -left-[5px] top-[3px] h-2.5 w-2.5 rounded-full border-2 border-primary bg-bg transition-colors group-hover:bg-primary"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <time
                dateTime={article.publishedAt ?? undefined}
                className="font-mono text-[11px] text-faint"
              >
                {timeAgo(article.publishedAt, locale)}
              </time>
              <Link
                href={`/section/${article.category.slug}`}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full ring-1 ring-primary/60" />
                {locale
                  ? translateCategory(locale, article.category.slug, article.category.name)
                  : article.category.name}
              </Link>
            </div>
            <h3 className="mt-1 font-heading text-[15px] font-bold leading-snug text-text">
              <Link
                href={`/article/${article.slug}`}
                className="line-clamp-2 transition-colors group-hover:text-primary"
              >
                {article.title}
              </Link>
            </h3>
          </li>
        ))}
      </ol>
    </section>
  );
}
