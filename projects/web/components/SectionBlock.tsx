import type { ArticleSummary } from '@/lib/api';
import { ArticleCard } from './ArticleCard';
import { SectionHeading } from './SectionHeading';
import { type Locale } from '@/lib/i18n';

/** A homepage block for one section: a connector heading + a few cards. */
export function SectionBlock({
  name,
  slug,
  articles,
  locale,
}: {
  name: string;
  slug: string;
  articles: ArticleSummary[];
  locale?: Locale;
}) {
  if (articles.length === 0) return null;
  return (
    <section aria-label={name}>
      <SectionHeading title={name} href={`/section/${slug}`} />
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </section>
  );
}
