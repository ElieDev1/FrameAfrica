'use client';

import { useTransition } from 'react';
import type { TipStatus } from '@/lib/cms';
import { updateTipStatus } from '@/lib/tips-actions';

const STATUSES: TipStatus[] = ['new', 'reviewing', 'actioned', 'dismissed'];

export function TipStatusControl({ id, status }: { id: string; status: TipStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending || s === status}
          onClick={() => startTransition(() => updateTipStatus(id, s))}
          className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition disabled:cursor-default ${
            s === status
              ? 'bg-primary/15 font-bold text-primary'
              : 'border border-border text-muted hover:text-text disabled:opacity-50'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
