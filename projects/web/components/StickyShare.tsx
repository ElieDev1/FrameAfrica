'use client';

import { useEffect, useState } from 'react';
import { BrandIcon, CheckIcon, LinkIcon } from '@/components/icons';
import { useLocale } from '@/components/LocaleProvider';
import { t } from '@/lib/i18n';

/**
 * A compact share bar pinned to the bottom of the screen on mobile only, shown
 * once the reader has scrolled into the story. Keeps sharing one tap away on
 * phones without cluttering the desktop layout (which uses the inline ShareBar).
 */
export function StickyShare({ title }: { title: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openers: { kind: 'x' | 'whatsapp' | 'facebook'; url: string }[] = [
    { kind: 'x', url: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${here()}` },
    { kind: 'whatsapp', url: `https://wa.me/?text=${enc(`${title} `)}${here()}` },
    { kind: 'facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${here()}` },
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
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur transition-transform sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {t(locale, 'share.label')}
        </span>
        <div className="flex items-center gap-2">
          {openers.map(({ kind, url }) => (
            <a
              key={kind}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t(locale, 'share.on')} ${kind === 'x' ? 'X' : kind.charAt(0).toUpperCase() + kind.slice(1)}`}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary"
            >
              <BrandIcon name={kind} size={16} />
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            aria-label={t(locale, 'share.copyLink')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary"
          >
            {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
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
