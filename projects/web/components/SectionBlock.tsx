import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';
import { ArticleCard } from './ArticleCard';

/** A homepage block for one section: a header + a few cards. */
export function SectionBlock({
  name,
  slug,
  articles,
}: {
  name: string;
  slug: string;
  articles: ArticleSummary[];
}) {
  if (articles.length === 0) return null;
  return (
    <section aria-label={name} className="border-t border-border pt-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-black tracking-tight text-text">
          <Link href={`/section/${slug}`} className="hover:text-primary">
            {name}
          </Link>
        </h2>
        <Link href={`/section/${slug}`} className="font-mono text-xs text-primary hover:underline">
          More →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
