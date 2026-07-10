'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ArticleSummary } from '@/lib/api';
import { ChevronRightIcon } from './icons';

const ROTATE_MS = 5500;
const MAX_DOTS = 7;

/**
 * Advanced breaking-news bar: a notched, pulsing "Breaking" flag; one headline
 * at a time (with its section kicker) rolling up on a timer; a live progress
 * bar; and clickable dot indicators to jump between stories. Pauses on hover and
 * honours reduced-motion. Uses the page font (no monospace).
 */
export function BreakingTicker({ articles }: { articles: ArticleSummary[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = articles.length;

  // setTimeout (not setInterval) so a manual jump restarts the countdown.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => setIndex((n) => (n + 1) % count), ROTATE_MS);
    return () => clearTimeout(id);
  }, [index, paused, count]);

  if (count === 0) return null;
  const current = articles[index % count];

  return (
    <aside
      aria-label="Breaking news"
      className="border-b border-accent-red/30 bg-gradient-to-r from-accent-red/12 via-accent-red/5 to-transparent"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-[1440px] items-stretch px-6">
        {/* Flag */}
        <span className="fa-breaking-badge relative z-10 -ml-6 flex shrink-0 items-center gap-2 bg-accent-red py-2.5 pl-6 pr-6 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Breaking
        </span>

        {/* Rolling headline with its section kicker */}
        <div className="relative min-w-0 flex-1 overflow-hidden py-2.5 pl-4 pr-4">
          <div className="relative h-6">
            <Link
              key={index}
              href={`/article/${current.slug}`}
              className={`fa-breaking-item absolute inset-0 flex items-center gap-2 ${paused ? 'fa-paused' : ''}`}
            >
              <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-accent-red sm:inline">
                {current.category.name}
              </span>
              <span className="hidden h-3 w-px shrink-0 bg-border sm:block" />
              <span className="truncate text-sm font-semibold text-text transition-colors hover:text-accent-red">
                {current.title}
              </span>
            </Link>
          </div>
          {count > 1 && (
            <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-border">
              <div
                key={index}
                className={`fa-breaking-progress h-full bg-accent-red ${paused ? 'fa-paused' : ''}`}
                style={{ animationDuration: `${ROTATE_MS}ms` }}
              />
            </div>
          )}
        </div>

        {/* Controls: dot indicators (few) or a counter (many) */}
        {count > 1 && (
          <div className="hidden shrink-0 items-center gap-3 self-center pl-2 sm:flex">
            {count <= MAX_DOTS ? (
              <div
                className="flex items-center gap-1.5"
                role="tablist"
                aria-label="Breaking stories"
              >
                {articles.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Story ${i + 1}: ${a.title}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-5 bg-accent-red' : 'w-1.5 bg-border hover:bg-faint'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[11px] font-medium tabular-nums tracking-[0.1em] text-faint">
                {String(index + 1).padStart(2, '0')}
                <span className="mx-1 opacity-50">/</span>
                {String(count).padStart(2, '0')}
              </span>
            )}
            <Link
              href={`/article/${current.slug}`}
              aria-label="Read this breaking story"
              className="grid h-6 w-6 place-items-center rounded-full text-faint transition hover:bg-accent-red/10 hover:text-accent-red"
            >
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
