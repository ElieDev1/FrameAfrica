import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';

/** A compact, imageless headline (for secondary stories and the Most-read list). */
export function HeadlineItem({ article, rank }: { article: ArticleSummary; rank?: number }) {
  return (
    <article className="flex gap-3 py-3">
      {rank !== undefined && (
        <span className="font-heading text-2xl font-black leading-none text-primary/60">
          {rank}
        </span>
      )}
      <div className="min-w-0">
        <Link
          href={`/section/${article.category.slug}`}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
        >
          {article.category.name}
        </Link>
        <h3 className="mt-0.5 font-heading font-bold leading-tight text-text">
          <Link href={`/article/${article.slug}`} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

export function MostRead({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="most-read">
      <h2
        id="most-read"
        className="border-b border-border pb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
      >
        Most read
      </h2>
      <div className="divide-y divide-border">
        {articles.map((article, index) => (
          <HeadlineItem key={article.id} article={article} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
