import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';
import { formatDate } from '@/lib/format';

function Badges({ article }: { article: ArticleSummary }) {
  return (
    <span className="flex items-center gap-2">
      <Link
        href={`/section/${article.category.slug}`}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
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
    </span>
  );
}

function Meta({ article }: { article: ArticleSummary }) {
  return (
    <p className="font-mono text-xs text-muted">
      {article.author.displayName}
      {article.publishedAt && <> · {formatDate(article.publishedAt)}</>}
      {article.readTimeMin && <> · {article.readTimeMin} min read</>}
    </p>
  );
}

/** A placeholder media block (the seed has no images yet). */
function Thumb({ featured }: { featured: boolean }) {
  return (
    <div
      className={`w-full rounded-xl bg-gradient-to-br from-surface-2 to-elev ${
        featured ? 'aspect-[16/9]' : 'aspect-[16/10]'
      }`}
      aria-hidden
    />
  );
}

export function ArticleCard({
  article,
  featured = false,
}: {
  article: ArticleSummary;
  featured?: boolean;
}) {
  const href = `/article/${article.slug}`;

  return (
    <article className="group flex flex-col gap-3">
      <Link href={href} className="block">
        <Thumb featured={featured} />
      </Link>
      <div className="flex flex-col gap-2">
        <Badges article={article} />
        <h3
          className={`font-heading font-bold leading-tight text-text ${
            featured ? 'text-3xl' : 'text-lg'
          }`}
        >
          <Link href={href} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && <p className="font-body text-muted">{article.excerpt}</p>}
        <Meta article={article} />
      </div>
    </article>
  );
}
