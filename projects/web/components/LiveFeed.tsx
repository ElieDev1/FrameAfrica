'use client';

import { useEffect, useState } from 'react';
import type { LiveUpdate } from '@/lib/api';
import { pollLiveUpdates } from '@/lib/live-actions';

const POLL_MS = 20_000;

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Live/developing-coverage feed. Renders the update stream newest-first and
 * polls the server every 20s so readers see new updates appear without a
 * refresh (`FR-LIVE`). `live` toggles the pulsing LIVE badge.
 */
export function LiveFeed({
  slug,
  initialUpdates,
  live,
}: {
  slug: string;
  initialUpdates: LiveUpdate[];
  live: boolean;
}) {
  const [updates, setUpdates] = useState(initialUpdates);
  // Re-render the relative times periodically even without new data.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    let active = true;
    const poll = async () => {
      const next = await pollLiveUpdates(slug);
      if (active && next.length > 0) setUpdates(next);
    };
    const id = setInterval(poll, POLL_MS);
    const tick = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => {
      active = false;
      clearInterval(id);
      clearInterval(tick);
    };
  }, [slug, live]);

  if (updates.length === 0 && !live) return null;

  const newest = updates[0];

  return (
    <section
      aria-label="Live coverage"
      className="mt-8 rounded-2xl border border-border bg-surface"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-red px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Live
            </span>
          )}
          <span className="font-heading text-sm font-bold text-text">
            {live ? 'Developing story' : 'Live coverage'}
          </span>
        </div>
        {newest && (
          <span className="font-mono text-[11px] text-faint">
            Updated {timeAgo(newest.createdAt)}
          </span>
        )}
      </header>

      <ol className="flex flex-col">
        {updates.map((update) => (
          <li key={update.id} className="border-b border-border px-5 py-4 last:border-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-faint">
              <span className="text-primary">{stamp(update.createdAt)}</span>
              {update.isKeyEvent && (
                <span className="rounded bg-accent-yellow px-1.5 py-0.5 font-semibold uppercase tracking-wide text-black">
                  Key event
                </span>
              )}
              <span>· {update.author}</span>
            </div>
            {update.headline && (
              <h3 className="mt-1.5 font-heading text-base font-bold text-text">
                {update.headline}
              </h3>
            )}
            <p className="mt-1 font-body text-[15px] leading-relaxed text-text/90">{update.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
