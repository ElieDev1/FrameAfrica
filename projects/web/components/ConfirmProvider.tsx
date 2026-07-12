'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/components/LocaleProvider';

export interface ConfirmOptions {
  /** Optional bold heading above the message. */
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get a red confirm button. */
  danger?: boolean;
}

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(() =>
  Promise.resolve(false),
);

/**
 * Our own confirm dialog, replacing the browser's `confirm()`. Returns a promise
 * that resolves true/false — so callers keep the familiar `if (!(await confirm(…)))
 * return;` shape, just async and styled to the app.
 */
export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const resolve = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && createPortal(<Dialog opts={opts} onResolve={resolve} />, document.body)}
    </ConfirmContext.Provider>
  );
}

function Dialog({
  opts,
  onResolve,
}: {
  opts: ConfirmOptions;
  onResolve: (value: boolean) => void;
}) {
  const t = useT();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    // Lock body scroll while the dialog is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResolve(false);
      else if (e.key === 'Enter') onResolve(true);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onResolve]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center p-4"
    >
      <button
        type="button"
        aria-label={opts.cancelLabel ?? t('common.cancel')}
        onClick={() => onResolve(false)}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-elev p-6 shadow-2xl ring-1 ring-black/5">
        {opts.title && (
          <h2 className="font-heading text-lg font-black tracking-tight text-text">{opts.title}</h2>
        )}
        <p className={`font-body text-sm leading-relaxed text-muted ${opts.title ? 'mt-1.5' : ''}`}>
          {opts.message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="rounded-lg border border-border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-border-2 hover:text-text"
          >
            {opts.cancelLabel ?? t('common.cancel')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onResolve(true)}
            className={`rounded-lg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition hover:opacity-90 ${
              opts.danger ? 'bg-accent-red text-white' : 'bg-primary text-black'
            }`}
          >
            {opts.confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
