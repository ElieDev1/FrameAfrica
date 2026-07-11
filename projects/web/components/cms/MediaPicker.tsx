'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useT } from '@/components/LocaleProvider';
import type { MediaAsset } from '@/lib/cms';
import { listMediaAction } from '@/lib/media-actions';

/**
 * "Choose from library" — a button that opens a modal grid of uploaded media
 * (fetched via a server action) and calls `onSelect` with the chosen asset.
 * Used by the block editor (image/gallery) and the featured-image field so
 * authors pick real uploads instead of pasting URLs.
 */
export function MediaPicker({
  onSelect,
  label,
}: {
  onSelect: (asset: MediaAsset) => void;
  label?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);

  useEffect(() => {
    if (open && assets === null) {
      void listMediaAction().then(setAssets);
    }
  }, [open, assets]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] text-muted hover:border-primary hover:text-primary"
      >
        {label ?? t('dmp.chooseFromLibrary')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('dash.mediaLibrary')}
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-heading text-lg font-bold text-text">{t('dash.mediaLibrary')}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-primary hover:text-primary"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(80vh-3.5rem)] overflow-y-auto p-5">
              {assets === null ? (
                <p className="py-12 text-center font-body text-sm text-muted">
                  {t('common.loading')}
                </p>
              ) : assets.length === 0 ? (
                <p className="py-12 text-center font-body text-sm text-muted">
                  {t('dmg.noImagesMatch')}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {assets.map((asset) => (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(asset);
                          setOpen(false);
                        }}
                        className="group block w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition hover:border-primary"
                      >
                        <span className="relative block aspect-[4/3] w-full bg-surface-2">
                          <Image
                            src={asset.url}
                            alt={asset.alt ?? ''}
                            fill
                            sizes="(max-width: 768px) 50vw, 180px"
                            className="object-cover"
                          />
                        </span>
                        <span className="block truncate px-2 py-1 font-body text-[11px] text-muted">
                          {asset.alt || asset.originalName || t('dmp.untitled')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
