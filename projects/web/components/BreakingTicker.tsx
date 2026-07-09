import Link from 'next/link';
import type { ArticleSummary } from '@/lib/api';

/**
 * Full-width breaking-news strip: a pulsing "Breaking" badge plus a seamless,
 * auto-scrolling marquee of headlines (pauses on hover, honours reduced-motion).
 * Renders nothing when there's no breaking news.
 */
export function BreakingTicker({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  // Duplicated once so the marquee can loop seamlessly (translate -50%).
  const loop = [...articles, ...articles];

  return (
    <div className="border-b border-accent-red/30 bg-gradient-to-r from-accent-red/15 via-accent-red/8 to-transparent">
      <div className="mx-auto flex max-w-[1440px] items-stretch px-6">
        <span className="fa-breaking-badge relative z-10 -ml-6 flex shrink-0 items-center gap-2 bg-accent-red py-2 pl-6 pr-6 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Breaking
        </span>

        <div className="fa-marquee-wrap relative flex-1 overflow-hidden py-2 pl-4">
          <div className="fa-marquee gap-8">
            {loop.map((article, i) => {
              const clone = i >= articles.length;
              return (
                <Link
                  key={`${article.id}-${i}`}
                  href={`/article/${article.slug}`}
                  aria-hidden={clone || undefined}
                  tabIndex={clone ? -1 : undefined}
                  className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-text transition-colors hover:text-accent-red"
                >
                  <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-accent-red/70" />
                  {article.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
