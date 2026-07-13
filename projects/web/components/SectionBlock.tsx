import type { ArticleSummary } from '@/lib/api';
import { ArticleCard } from './ArticleCard';
import { HeadlineItem } from './HeadlineList';
import { SectionHeading } from './SectionHeading';
import { type Locale } from '@/lib/i18n';

/**
 * A homepage block for one section. Two shapes, alternated down the page so the
 * front reads like a newspaper rather than a catalogue of identical tiles:
 *
 * - `feature`: one wide lead story (image beside text) next to a plain
 *   headline list with timestamps — mostly type, one photo.
 * - `cards`: a dense row of small cards, up to five across.
 */
export function SectionBlock({
  name,
  slug,
  articles,
  locale,
  variant = 'cards',
}: {
  name: string;
  slug: string;
  articles: ArticleSummary[];
  locale?: Locale;
  variant?: 'cards' | 'feature';
}) {
  if (articles.length === 0) return null;

  if (variant === 'feature') {
    const [lead, ...rest] = articles;
    return (
      <section aria-label={name}>
        <SectionHeading title={name} href={`/section/${slug}`} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
          <ArticleCard article={lead} horizontal locale={locale} />
          {rest.length > 0 && (
            <div className="divide-y divide-border lg:border-l lg:border-border lg:pl-8">
              {rest.slice(0, 4).map((article) => (
                <HeadlineItem key={article.id} article={article} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

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
