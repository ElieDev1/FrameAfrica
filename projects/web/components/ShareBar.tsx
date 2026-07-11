'use client';

import { useState } from 'react';
import { BrandIcon, CheckIcon, LinkIcon, MailIcon } from '@/components/icons';
import { useLocale } from '@/components/LocaleProvider';
import { t } from '@/lib/i18n';

const OPENERS: Record<string, (title: string, url: string) => string> = {
  x: (title, url) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  facebook: (_title, url) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  whatsapp: (title, url) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  linkedin: (_title, url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
};

const iconClass =
  'grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-primary hover:text-primary';

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  const labels: Record<string, string> = {
    x: `${t(locale, 'share.on')} X`,
    facebook: `${t(locale, 'share.on')} Facebook`,
    whatsapp: `${t(locale, 'share.on')} WhatsApp`,
    linkedin: `${t(locale, 'share.on')} LinkedIn`,
  };

  function open(kind: string) {
    window.open(OPENERS[kind](title, window.location.href), '_blank', 'noopener,noreferrer');
  }

  function email() {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
      window.location.href,
    )}`;
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
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {t(locale, 'share.label')}
      </span>
      {(['x', 'facebook', 'whatsapp', 'linkedin'] as const).map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => open(kind)}
          aria-label={labels[kind]}
          className={iconClass}
        >
          <BrandIcon name={kind} size={16} />
        </button>
      ))}
      <button
        type="button"
        onClick={email}
        aria-label={t(locale, 'share.byEmail')}
        className={iconClass}
      >
        <MailIcon size={16} />
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label={t(locale, 'share.copyLink')}
        className={`${iconClass} ${copied ? 'border-accent-green text-accent-green' : ''}`}
      >
        {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
      </button>
    </div>
  );
}
