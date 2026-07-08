import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';

/** Full-width breaking-news strip. Renders nothing when there's no breaking news. */
export function BreakingTicker({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="border-b border-border bg-accent-red/10">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-6 py-2">
        <span className="shrink-0 rounded bg-accent-red px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
          Breaking
        </span>
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="font-body text-sm text-text hover:text-primary"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
