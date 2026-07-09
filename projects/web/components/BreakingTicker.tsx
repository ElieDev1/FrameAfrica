'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ArticleSummary } from '@/lib/api';

const ROTATE_MS = 5000;

/**
 * Single-line breaking-news bar: a notched "Breaking" flag with a live pulse,
 * and one headline at a time that rolls up from the bottom on a timer (pauses
 * on hover, honours reduced-motion). A thin progress bar tracks each rotation.
 */
export function BreakingTicker({ articles }: { articles: ArticleSummary[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = articles.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;
  const current = articles[index % count];

  return (
    <div
      className="border-b border-accent-red/30 bg-gradient-to-r from-accent-red/15 via-accent-red/8 to-transparent"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-[1440px] items-stretch px-6">
        <span className="fa-breaking-badge relative z-10 -ml-6 flex shrink-0 items-center gap-2 bg-accent-red py-2.5 pl-6 pr-6 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Breaking
        </span>

        {/* One headline at a time, rolling up from the bottom. */}
        <div className="relative flex-1 overflow-hidden py-2.5 pl-4">
          <div className="relative h-6">
            <Link
              key={index}
              href={`/article/${current.slug}`}
              className={`fa-breaking-item absolute inset-0 flex items-center text-sm font-medium text-text transition-colors hover:text-accent-red ${
                paused ? 'fa-paused' : ''
              }`}
            >
              <span className="truncate">{current.title}</span>
            </Link>
          </div>
          {count > 1 && (
            <div className="pointer-events-none absolute bottom-0 left-4 right-0 h-px bg-border">
              <div
                key={index}
                className={`fa-breaking-progress h-full bg-accent-red ${paused ? 'fa-paused' : ''}`}
                style={{ animationDuration: `${ROTATE_MS}ms` }}
              />
            </div>
          )}
        </div>

        {/* Position counter — a subtle "03 / 10". */}
        {count > 1 && (
          <span className="hidden shrink-0 items-center self-center pl-4 font-mono text-[10px] tabular-nums tracking-[0.12em] text-faint sm:flex">
            {String(index + 1).padStart(2, '0')}
            <span className="mx-1 opacity-50">/</span>
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
    </div>
  );
}
