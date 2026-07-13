import Image from 'next/image';
import Link from 'next/link';
import { ClockIcon } from '@/components/icons';
import type { ArticleSummary, FeaturedImage } from '@/lib/api';
import { newsTime } from '@/lib/format';
import { type Locale, t, translateCategory } from '@/lib/i18n';

/** The pulsing LIVE flag — the strongest signal on any news front. */
export function LiveBadge({ locale }: { locale?: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-accent-red px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
      {locale ? t(locale, 'article.live') : 'Live'}
    </span>
  );
}

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
      {article.isLive && <LiveBadge locale={locale} />}
      {article.isBreaking && !article.isLive && (
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

function Meta({
  article,
  locale,
  compact = false,
}: {
  article: ArticleSummary;
  locale?: Locale;
  compact?: boolean;
}) {
  // Small cards carry only the freshness signal; the byline is for full cards.
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted">
      {!compact && <span className="text-text/80">{article.author.displayName}</span>}
      {article.publishedAt && (
        <span>
          {compact ? '' : '· '}
          {newsTime(article.publishedAt, locale)}
        </span>
      )}
      {!compact && article.readTimeMin && (
        <span className="inline-flex items-center gap-1">
          · <ClockIcon size={12} /> {article.readTimeMin} {locale ? t(locale, 'common.min') : 'min'}
        </span>
      )}
    </p>
  );
}

/** The featured image, or a deliberate branded panel when the story has none. */
function Thumb({
  aspect,
  sizes,
  kicker,
  image,
}: {
  aspect: string;
  sizes: string;
  kicker: string;
  image: FeaturedImage | null;
}) {
  if (image) {
    return (
      <div className={`relative w-full overflow-hidden ${aspect}`}>
        <Image src={image.url} alt={image.alt ?? ''} fill sizes={sizes} className="object-cover" />
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
  compact = false,
  horizontal = false,
  locale,
}: {
  article: ArticleSummary;
  featured?: boolean;
  /** Dense variant for the multi-up section bands: no excerpt, smaller headline. */
  compact?: boolean;
  /** Wide lead variant: image beside the text, used at the top of a section. */
  horizontal?: boolean;
  locale?: Locale;
}) {
  const href = `/article/${article.slug}`;
  const kicker = locale
    ? translateCategory(locale, article.category.slug, article.category.name)
    : article.category.name;

  const headingSize = horizontal
    ? 'text-xl md:text-2xl'
    : featured
      ? 'text-2xl md:text-3xl'
      : compact
        ? 'text-[15px] leading-snug'
        : 'text-lg';

  // A shorter 21:9 keeps the featured hero from eating the viewport; the wide
  // lead and standard cards use a comfortable landscape crop.
  const aspect = featured ? 'aspect-[21/9]' : 'aspect-[16/10]';
  const sizes = featured
    ? '(max-width: 1024px) 100vw, 66vw'
    : horizontal
      ? '(max-width: 640px) 100vw, 45vw'
      : '(max-width: 640px) 100vw, 33vw';

  const thumb = (
    <Link
      href={href}
      className="block overflow-hidden ring-1 ring-border transition-all duration-300 group-hover:ring-border-2"
    >
      <div className="transition-transform duration-500 group-hover:scale-[1.03]">
        <Thumb aspect={aspect} sizes={sizes} kicker={kicker} image={article.featuredImage} />
      </div>
    </Link>
  );

  const text = (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      <Badges article={article} locale={locale} />
      <h3
        className={`font-heading font-bold leading-[1.14] tracking-tight text-text ${headingSize}`}
      >
        <Link
          href={href}
          className={`transition-colors group-hover:text-primary ${compact ? 'line-clamp-3' : ''}`}
        >
          {article.title}
        </Link>
      </h3>
      {!compact && article.excerpt && (
        <p
          className={`font-body text-muted ${featured || horizontal ? 'text-base' : 'text-[0.95rem]'}`}
        >
          {article.excerpt}
        </p>
      )}
      <Meta article={article} locale={locale} compact={compact} />
    </div>
  );

  if (horizontal) {
    return (
      <article className="group grid gap-5 sm:grid-cols-[1.35fr_1fr] sm:items-center">
        {thumb}
        {text}
      </article>
    );
  }

  return (
    <article className={`group flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {thumb}
      {text}
    </article>
  );
}
