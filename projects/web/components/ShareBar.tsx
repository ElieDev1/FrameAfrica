'use client';

import { useState } from 'react';

const OPENERS: Record<string, (title: string, url: string) => string> = {
  X: (title, url) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  Facebook: (_title, url) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  WhatsApp: (title, url) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
};

const buttonClass =
  'rounded-lg border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted hover:border-primary hover:text-primary';

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function open(kind: string) {
    window.open(OPENERS[kind](title, window.location.href), '_blank', 'noopener,noreferrer');
  }

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
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Share</span>
      {Object.keys(OPENERS).map((kind) => (
        <button key={kind} type="button" onClick={() => open(kind)} className={buttonClass}>
          {kind}
        </button>
      ))}
      <button type="button" onClick={copy} className={buttonClass}>
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
    </div>
  );
}
