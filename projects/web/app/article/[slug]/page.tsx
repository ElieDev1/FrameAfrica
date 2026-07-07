import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { ShareBar } from '@/components/ShareBar';
import { fetchArticle, fetchRelated } from '@/lib/api';
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

  const related = await fetchRelated(slug);
  const paragraphs = article.body.split('\n\n').filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 font-mono text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden> › </span>
        <Link href={`/section/${article.category.slug}`} className="text-primary hover:underline">
          {article.category.name}
        </Link>
      </nav>

      <div className="mb-3 flex items-center gap-2">
        <Link
          href={`/section/${article.category.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary hover:underline"
        >
          {article.category.name}
        </Link>
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

      <h1 className="font-heading text-4xl font-black leading-[1.08] tracking-tight text-text md:text-5xl">
        {article.title}
      </h1>

      {article.subtitle && (
        <p className="mt-4 font-body text-xl leading-relaxed text-muted">{article.subtitle}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted">
        <span className="text-text">{article.author.displayName}</span>
        {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
        {article.readTimeMin && <span>· {article.readTimeMin} min read</span>}
      </div>

      <div className="mt-5">
        <ShareBar title={article.title} />
      </div>

      <div
        className="media-fill mt-8 aspect-[16/9] w-full rounded-2xl ring-1 ring-border"
        aria-hidden
      >
        <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text/70">
          {article.category.name}
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-5 font-body text-lg leading-[1.75] text-text">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={index === 0 ? 'text-[1.35rem] leading-[1.6] text-text/95' : undefined}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {article.isLocked && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border-2 bg-surface px-6 py-10 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Premium story
          </span>
          <p className="font-heading text-xl font-bold text-text">Subscribe to keep reading</p>
          <p className="max-w-sm font-body text-sm text-muted">
            This story is available to Frame Africa subscribers. Plans and payment (MoMo, Airtel
            Money, card) are coming soon.
          </p>
        </div>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12 border-t border-border pt-8">
          <h2
            id="related"
            className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted"
          >
            Related stories
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <Link href="/" className="font-mono text-xs text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
