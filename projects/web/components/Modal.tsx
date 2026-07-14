'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/icons';

/**
 * A portalled modal for the small forms that used to sit inline on a row
 * (schedule a story, return it to its author). Locks scroll, closes on Escape
 * or a backdrop click. Only rendered while open, so it never runs on the server.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:text-text"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
