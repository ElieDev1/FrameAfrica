'use client';

import { useEffect, useState } from 'react';

/**
 * A thin progress bar fixed to the top of the viewport that fills as the reader
 * scrolls through the article — a small, familiar reading aid (documents/06 §4.2).
 * Purely decorative, so it is hidden from assistive tech.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="h-full origin-left bg-primary transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
