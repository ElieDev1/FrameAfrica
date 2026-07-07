import { HeadlineItem } from './HeadlineList';
import type { ArticleSummary } from '@/lib/api';

/** A short, curated "Editor's picks" list for the homepage sidebar. */
export function EditorsPicks({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="editors-picks">
      <h2
        id="editors-picks"
        className="border-b border-border pb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
      >
        Editor&apos;s picks
      </h2>
      <div className="divide-y divide-border">
        {articles.map((article) => (
          <HeadlineItem key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
