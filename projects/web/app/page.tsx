import { ArticleCard } from '@/components/ArticleCard';
import { fetchArticles, type ArticleSummary } from '@/lib/api';

export const revalidate = 60;

export default async function Home() {
  let articles: ArticleSummary[] = [];
  let failed = false;

  try {
    ({ articles } = await fetchArticles({ limit: 12 }));
  } catch {
    failed = true;
  }

  if (failed || articles.length === 0) {
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

  const [lead, ...rest] = articles;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="sr-only">Frame Africa — latest news</h1>

      <section aria-label="Lead story" className="border-b border-border pb-10">
        <ArticleCard article={lead} featured />
      </section>

      {rest.length > 0 && (
        <section aria-labelledby="latest" className="pt-10">
          <h2 id="latest" className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Latest
          </h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
