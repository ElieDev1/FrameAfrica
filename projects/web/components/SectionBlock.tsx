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
      {/* Dense multi-up row: small cards, up to five across on wide screens. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} compact locale={locale} />
        ))}
      </div>
    </section>
  );
}
