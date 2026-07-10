'use client';

import { useState } from 'react';
import { BrandIcon, CheckIcon, LinkIcon } from '@/components/icons';

/**
 * Vertical share rail pinned beside the article on large screens — fills the
 * left margin with one-tap sharing (X, WhatsApp, Facebook, copy link) that
 * follows the reader down the page. The mobile equivalent is {@link StickyShare}.
 */
export function ArticleShareRail({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const enc = (v: string) => encodeURIComponent(v);
  const here = () =>
    typeof window === 'undefined' ? '' : encodeURIComponent(window.location.href);

  const openers: { kind: 'x' | 'whatsapp' | 'facebook'; label: string; url: string }[] = [
    {
      kind: 'x',
      label: 'X',
      url: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${here()}`,
    },
    {
      kind: 'whatsapp',
      label: 'WhatsApp',
      url: `https://wa.me/?text=${enc(`${title} `)}${here()}`,
    },
    {
      kind: 'facebook',
      label: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${here()}`,
    },
  ];

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
    <div className="flex flex-col items-center gap-2.5">
      <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
        Share
      </span>
      {openers.map(({ kind, label, url }) => (
        <a
          key={kind}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition hover:border-primary hover:text-primary"
        >
          <BrandIcon name={kind} size={16} />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition hover:border-primary hover:text-primary"
      >
        {copied ? <CheckIcon size={16} className="text-accent-green" /> : <LinkIcon size={16} />}
      </button>
    </div>
  );
}
