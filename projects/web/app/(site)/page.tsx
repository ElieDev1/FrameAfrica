import { AdSlot } from '@/components/AdSlot';
import { ArticleCard } from '@/components/ArticleCard';
import { BreakingTicker } from '@/components/BreakingTicker';
import { EditorsPicks } from '@/components/EditorsPicks';
import { MostRead } from '@/components/HeadlineList';
import { HeroSidebar } from '@/components/HeroSidebar';
import { MarketsWidget } from '@/components/MarketsWidget';
import { NewsletterBox } from '@/components/NewsletterBox';
import { SectionBlock } from '@/components/SectionBlock';
import { SectionHeading } from '@/components/SectionHeading';
import { VideoStrip } from '@/components/VideoStrip';
import { WeatherWidget } from '@/components/WeatherWidget';
import { fetchArticles, fetchCategories, type ArticleSummary } from '@/lib/api';
import { t, translateCategory } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const revalidate = 60;

interface SectionData {
  name: string;
  slug: string;
  articles: ArticleSummary[];
}

export default async function Home() {
  const locale = await getLocale();
  let latest: ArticleSummary[] = [];
  let popular: ArticleSummary[] = [];
  let featured: ArticleSummary[] = [];
  let failed = false;

  try {
    const [latestRes, popularRes, featuredRes] = await Promise.all([
      fetchArticles({ limit: 19 }),
      fetchArticles({ sort: 'popular', limit: 6 }),
      fetchArticles({ featured: true, limit: 5 }),
    ]);
    latest = latestRes.articles;
    popular = popularRes.articles;
    featured = featuredRes.articles;
  } catch {
    failed = true;
  }

  if (failed || latest.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-text">
          {failed ? t(locale, 'home.errTitle') : t(locale, 'home.noStories')}
        </h1>
        <p className="mt-2 font-body text-muted">
          {failed ? t(locale, 'home.errBody') : t(locale, 'home.noStoriesBody')}
        </p>
      </div>
    );
  }

  // The front-page lead is the newest editor-featured story (fallback: newest).
  const lead = featured[0] ?? latest[0];
  const rest = latest.filter((a) => a.id !== lead.id);
  const secondary = rest.slice(0, 4);
  const river = rest.slice(4);
  const featuredPicks = featured.filter((a) => a.id !== lead.id);
  const picks = (featuredPicks.length > 0 ? featuredPicks : rest).slice(0, 4);
  const breaking = latest.filter((a) => a.isBreaking);

  let sections: SectionData[] = [];
  try {
    const categories = (await fetchCategories()).slice(0, 4);
    sections = (
      await Promise.all(
        categories.map(async (category) => ({
          name: translateCategory(locale, category.slug, category.name),
          slug: category.slug,
          articles: (await fetchArticles({ category: category.slug, limit: 3 })).articles,
        })),
      )
    ).filter((s) => s.articles.length > 0);
  } catch {
    sections = [];
  }

  return (
    <>
      <BreakingTicker articles={breaking} locale={locale} />
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <h1 className="sr-only">Frame Africa — latest news</h1>

        {/* Hero: lead + secondary rail */}
        <section
          aria-label={t(locale, 'home.topStories')}
          className="grid gap-8 border-b border-border pb-10 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            <ArticleCard article={lead} featured locale={locale} />
          </div>
          <HeroSidebar articles={secondary} locale={locale} />
        </section>

        <AdSlot variant="leaderboard" className="mt-10" />

        {/* Main river + sticky rail */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main>
            <SectionHeading title={t(locale, 'home.latest')} id="latest" />
            {river.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {river.map((article) => (
                  <ArticleCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            ) : (
              <p className="font-body text-muted">{t(locale, 'home.moreSoon')}</p>
            )}
            <AdSlot variant="native" className="mt-10" />
          </main>

          <aside className="flex flex-col gap-8">
            <MostRead articles={popular} locale={locale} />
            <EditorsPicks articles={picks} />
            <WeatherWidget />
            <MarketsWidget />
            <NewsletterBox />
            <AdSlot variant="halfpage" sticky />
          </aside>
        </div>

        {/* Section bands */}
        {sections.length > 0 && (
          <div className="mt-14 flex flex-col gap-14">
            {sections.map((section) => (
              <SectionBlock
                key={section.slug}
                name={section.name}
                slug={section.slug}
                articles={section.articles}
                locale={locale}
              />
            ))}
          </div>
        )}

        <VideoStrip />

        <AdSlot variant="billboard" className="mt-12" />
      </div>
    </>
  );
}
