import Image from 'next/image';
import Link from 'next/link';
import { ClockIcon } from '@/components/icons';
import type { ArticleSummary, FeaturedImage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { type Locale, t, translateCategory } from '@/lib/i18n';

function Badges({ article, locale }: { article: ArticleSummary; locale?: Locale }) {
  return (
    <span className="flex items-center gap-2">
      <Link
        href={`/section/${article.category.slug}`}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
      >
        {locale
          ? translateCategory(locale, article.category.slug, article.category.name)
          : article.category.name}
      </Link>
      {article.isBreaking && (
        <span className="rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
          {locale ? t(locale, 'home.breaking') : 'Breaking'}
        </span>
      )}
      {article.isPremium && (
        <span className="rounded bg-accent-yellow px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-black">
          {locale ? t(locale, 'article.premium') : 'Premium'}
        </span>
      )}
    </span>
  );
}

function Meta({ article, locale }: { article: ArticleSummary; locale?: Locale }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted">
      <span className="text-text/80">{article.author.displayName}</span>
      {article.publishedAt && <span>· {formatDate(article.publishedAt)}</span>}
      {article.readTimeMin && (
        <span className="inline-flex items-center gap-1">
          · <ClockIcon size={12} /> {article.readTimeMin} {locale ? t(locale, 'common.min') : 'min'}
        </span>
      )}
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
  // A shorter 21:9 on the lead keeps the hero from eating the whole viewport.
  const aspect = featured ? 'aspect-[21/9]' : 'aspect-[16/10]';
  if (image) {
    return (
      <div className={`relative w-full overflow-hidden ${aspect}`}>
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
    <div className={`media-fill w-full ${aspect}`} aria-hidden>
      <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text/70">
        {kicker}
      </span>
    </div>
  );
}

export function ArticleCard({
  article,
  featured = false,
  locale,
}: {
  article: ArticleSummary;
  featured?: boolean;
  locale?: Locale;
}) {
  const href = `/article/${article.slug}`;
  const kicker = locale
    ? translateCategory(locale, article.category.slug, article.category.name)
    : article.category.name;

  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={href}
        className="block overflow-hidden ring-1 ring-border transition-all duration-300 group-hover:ring-border-2"
      >
        <div className="transition-transform duration-500 group-hover:scale-[1.03]">
          <Thumb featured={featured} kicker={kicker} image={article.featuredImage} />
        </div>
      </Link>
      <div className="flex flex-col gap-2">
        <Badges article={article} locale={locale} />
        <h3
          className={`font-heading font-bold leading-[1.14] tracking-tight text-text ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          <Link href={href} className="transition-colors group-hover:text-primary">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className={`font-body text-muted ${featured ? 'text-base' : 'text-[0.95rem]'}`}>
            {article.excerpt}
          </p>
        )}
        <Meta article={article} locale={locale} />
      </div>
    </article>
  );
}
