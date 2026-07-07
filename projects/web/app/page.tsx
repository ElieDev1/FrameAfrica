import { AdSlot } from '@/components/AdSlot';
import { ArticleCard } from '@/components/ArticleCard';
import { BreakingTicker } from '@/components/BreakingTicker';
import { EditorsPicks } from '@/components/EditorsPicks';
import { HeadlineItem, MostRead } from '@/components/HeadlineList';
import { MarketsWidget } from '@/components/MarketsWidget';
import { NewsletterBox } from '@/components/NewsletterBox';
import { SectionBlock } from '@/components/SectionBlock';
import { VideoStrip } from '@/components/VideoStrip';
import { WeatherWidget } from '@/components/WeatherWidget';
import { fetchArticles, fetchCategories, type ArticleSummary } from '@/lib/api';

export const revalidate = 60;

interface SectionData {
  name: string;
  slug: string;
  articles: ArticleSummary[];
}

export default async function Home() {
  let latest: ArticleSummary[] = [];
  let popular: ArticleSummary[] = [];
  let failed = false;

  try {
    const [latestRes, popularRes] = await Promise.all([
      fetchArticles({ limit: 13 }),
      fetchArticles({ sort: 'popular', limit: 5 }),
    ]);
    latest = latestRes.articles;
    popular = popularRes.articles;
  } catch {
    failed = true;
  }

  if (failed || latest.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-text">
          {failed ? 'News is taking a short break' : 'No stories yet'}
        </h1>
        <p className="mt-2 font-body text-muted">
          {failed
            ? 'We could not reach the newsroom just now. Please try again shortly.'
            : 'Published stories will appear here as the newsroom starts publishing.'}
        </p>
      </div>
    );
  }

  const [lead, ...rest] = latest;
  const secondary = rest.slice(0, 4);
  const river = rest.slice(4);
  const picks = rest.slice(0, 3);
  const breaking = latest.filter((article) => article.isBreaking);

  let sections: SectionData[] = [];
  try {
    const categories = (await fetchCategories()).slice(0, 3);
    sections = await Promise.all(
      categories.map(async (category) => ({
        name: category.name,
        slug: category.slug,
        articles: (await fetchArticles({ category: category.slug, limit: 3 })).articles,
      })),
    );
  } catch {
    sections = [];
  }

  return (
    <>
      <BreakingTicker articles={breaking} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="sr-only">Frame Africa — latest news</h1>

        <section
          aria-label="Top stories"
          className="grid gap-8 border-b border-border pb-10 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <ArticleCard article={lead} featured />
          </div>
          {secondary.length > 0 && (
            <div className="divide-y divide-border lg:border-l lg:border-border lg:pl-8">
              {secondary.map((article) => (
                <HeadlineItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        <AdSlot variant="leaderboard" className="mt-10" />

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <section aria-labelledby="latest" className="lg:col-span-2">
            <h2
              id="latest"
              className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted"
            >
              Latest
            </h2>
            {river.length > 0 ? (
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                {river.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="font-body text-muted">More stories coming soon.</p>
            )}
          </section>

          <aside className="flex flex-col gap-8">
            <MostRead articles={popular} />
            <EditorsPicks articles={picks} />
            <WeatherWidget />
            <MarketsWidget />
            <NewsletterBox />
            <AdSlot variant="rectangle" />
          </aside>
        </div>

        {sections.length > 0 && (
          <div className="mt-12 flex flex-col gap-12">
            {sections.map((section) => (
              <SectionBlock
                key={section.slug}
                name={section.name}
                slug={section.slug}
                articles={section.articles}
              />
            ))}
          </div>
        )}

        <VideoStrip />

        <AdSlot variant="leaderboard" className="mt-12" />
      </div>
    </>
  );
}
