import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { fetchArticles, fetchCategory } from '@/lib/api';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    return { title: 'Section not found — Frame Africa' };
  }
  return {
    title: `${category.name} — Frame Africa`,
    description: category.description ?? `The latest ${category.name} news from Frame Africa.`,
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    notFound();
  }

  const { articles } = await fetchArticles({ category: slug, limit: 24 });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Section</p>
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl font-body text-muted">{category.description}</p>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">No stories in this section yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
