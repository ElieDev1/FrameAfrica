import type { ArticleSummary } from '@/lib/api';
import { HeadlineItem } from './HeadlineList';
import { RailHeading } from './SectionHeading';

/** A short, curated "Editor's picks" list for the homepage sidebar. */
export function EditorsPicks({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="editors-picks">
      <RailHeading title="Editor's picks" id="editors-picks" />
      <div className="divide-y divide-border">
        {articles.map((article) => (
          <HeadlineItem key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
