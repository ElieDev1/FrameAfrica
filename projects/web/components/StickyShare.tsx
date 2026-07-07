'use client';

import { useEffect, useState } from 'react';

/**
 * A compact share bar pinned to the bottom of the screen on mobile only, shown
 * once the reader has scrolled into the story. Keeps sharing one tap away on
 * phones without cluttering the desktop layout (which uses the inline ShareBar).
 */
export function StickyShare({ title }: { title: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openers: Record<string, string> = {
    X: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${here()}`,
    WhatsApp: `https://wa.me/?text=${enc(`${title} `)}${here()}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${here()}`,
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore
    }
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur transition-transform sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Share</span>
        <div className="flex items-center gap-2">
          {Object.entries(openers).map(([kind, url]) => (
            <a
              key={kind}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted hover:border-primary hover:text-primary"
            >
              {kind}
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted hover:border-primary hover:text-primary"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function enc(v: string): string {
  return encodeURIComponent(v);
}

function here(): string {
  return typeof window === 'undefined' ? '' : encodeURIComponent(window.location.href);
}
