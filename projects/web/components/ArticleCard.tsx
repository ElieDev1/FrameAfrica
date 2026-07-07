import Image from 'next/image';
import Link from 'next/link';
import type { ArticleSummary, FeaturedImage } from '@/lib/api';
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

/** The featured image, or a deliberate branded panel when the story has none. */
function Thumb({
  featured,
  kicker,
  image,
}: {
  featured: boolean;
  kicker: string;
  image: FeaturedImage | null;
}) {
  const aspect = featured ? 'aspect-[16/9]' : 'aspect-[16/10]';
  if (image) {
    return (
      <div className={`relative w-full overflow-hidden rounded-xl ${aspect}`}>
        <Image
          src={image.url}
          alt={image.alt ?? ''}
          fill
          sizes={featured ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className={`media-fill w-full rounded-xl ${aspect}`} aria-hidden>
      <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text/70">
        {kicker}
      </span>
    </div>
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
      <Link
        href={href}
        className="block overflow-hidden rounded-xl ring-1 ring-border transition-all duration-300 group-hover:ring-border-2"
      >
        <div className="transition-transform duration-500 group-hover:scale-[1.03]">
          <Thumb featured={featured} kicker={article.category.name} image={article.featuredImage} />
        </div>
      </Link>
      <div className="flex flex-col gap-2">
        <Badges article={article} />
        <h3
          className={`font-heading font-bold leading-[1.12] tracking-tight text-text ${
            featured ? 'text-3xl md:text-[2.6rem]' : 'text-lg'
          }`}
        >
          <Link href={href} className="transition-colors group-hover:text-primary">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className={`font-body text-muted ${featured ? 'text-lg' : 'text-[0.95rem]'}`}>
            {article.excerpt}
          </p>
        )}
        <Meta article={article} />
      </div>
    </article>
  );
}
