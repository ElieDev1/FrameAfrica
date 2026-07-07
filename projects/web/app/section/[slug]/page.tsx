import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LoadMore } from '@/components/LoadMore';
import { fetchArticles, fetchCategory } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    return { title: 'Section not found' };
  }
  const description = category.description ?? `The latest ${category.name} news from Frame Africa.`;
  const path = `/section/${category.slug}`;
  return {
    title: category.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', title: category.name, description, url: absoluteUrl(path) },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) {
    notFound();
  }

  const { articles, pagination } = await fetchArticles({ category: slug, limit: 12 });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border pb-6">
        {category.parent ? (
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
            <Link
              href={`/section/${category.parent.slug}`}
              className="text-primary hover:underline"
            >
              {category.parent.name}
            </Link>
            <span aria-hidden> › </span>
            <span>{category.name}</span>
          </nav>
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Section</p>
        )}
        <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl font-body text-muted">{category.description}</p>
        )}

        {category.children.length > 0 && (
          <nav aria-label="Sub-sections" className="mt-4 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/section/${child.slug}`}
                className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
              >
                {child.name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="py-16 text-center font-body text-muted">No stories in this section yet.</p>
      ) : (
        <LoadMore
          initialArticles={articles}
          initialCursor={pagination?.nextCursor ?? null}
          category={slug}
        />
      )}
    </div>
  );
}
