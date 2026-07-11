'use client';

import { useCallback, useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import type { PublicGalleryImage } from '@/lib/galleries';

export function GalleryViewer({ images }: { images: PublicGalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((i) => (i === null ? null : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  const active = open === null ? null : images[open];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-surface-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={close}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          <div
            className="flex flex-1 items-center justify-between gap-2 px-2 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-4 text-2xl text-white hover:bg-white/20"
              aria-label="Previous"
            >
              ‹
            </button>
            <figure className="flex max-h-full flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt={active.alt}
                className="max-h-[75vh] max-w-full rounded object-contain"
              />
              {(active.caption || active.credit) && (
                <figcaption className="mt-3 max-w-2xl text-center font-body text-sm text-white/80">
                  {active.caption}
                  {active.credit && (
                    <span className="ml-2 font-mono text-[11px] text-white/50">
                      {active.credit}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
            <button
              type="button"
              onClick={() => step(1)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-4 text-2xl text-white hover:bg-white/20"
              aria-label="Next"
            >
              ›
            </button>
          </div>
          <p className="pb-4 text-center font-mono text-[11px] text-white/50">
            {open! + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
