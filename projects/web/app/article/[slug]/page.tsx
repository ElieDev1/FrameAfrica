import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArticle } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: 'Article not found — Frame Africa' };
  }
  return {
    title: `${article.title} — Frame Africa`,
    description: article.excerpt ?? article.subtitle ?? undefined,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    notFound();
  }

  const paragraphs = article.body.split('\n\n').filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 font-mono text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden> › </span>
        <span className="text-primary">{article.category.name}</span>
      </nav>

      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
          {article.category.name}
        </span>
        {article.isBreaking && (
          <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
            Breaking
          </span>
        )}
        {article.isPremium && (
          <span className="rounded bg-accent-yellow px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-black">
            Premium
          </span>
        )}
      </div>

      <h1 className="font-heading text-4xl font-black leading-tight tracking-tight text-text">
        {article.title}
      </h1>

      {article.subtitle && <p className="mt-3 font-body text-xl text-muted">{article.subtitle}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted">
        <span className="text-text">{article.author.displayName}</span>
        {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
        {article.readTimeMin && <span>· {article.readTimeMin} min read</span>}
      </div>

      <div
        className="mt-8 aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-surface-2 to-elev"
        aria-hidden
      />

      <div className="mt-8 flex flex-col gap-5 font-body text-lg leading-relaxed text-text">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <Link href="/" className="font-mono text-xs text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
