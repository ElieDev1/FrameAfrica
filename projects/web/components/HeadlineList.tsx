import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';
import { RailHeading } from './SectionHeading';

/** A compact, imageless headline (for secondary stories and curated lists). */
export function HeadlineItem({ article, rank }: { article: ArticleSummary; rank?: number }) {
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
        <Link
          href={`/section/${article.category.slug}`}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
        >
          {article.category.name}
        </Link>
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
export function MostRead({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="most-read">
      <RailHeading title="Most read" id="most-read" />
      <div className="divide-y divide-border">
        {articles.map((article, index) => (
          <HeadlineItem key={article.id} article={article} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
