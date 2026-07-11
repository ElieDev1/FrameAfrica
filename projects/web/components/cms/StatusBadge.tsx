'use client';

import { useT } from '@/components/LocaleProvider';
import type { MessageKey } from '@/lib/i18n';

const STYLES: Record<string, string> = {
  draft: 'text-muted border-border',
  in_progress: 'text-accent-yellow border-accent-yellow',
  copy_edit: 'text-accent-yellow border-accent-yellow',
  ready: 'text-primary border-primary',
  embargoed: 'text-primary border-primary',
  rejected: 'text-accent-red border-accent-red',
  published: 'text-accent-green border-accent-green',
  archived: 'text-faint border-border',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const cls = STYLES[status] ?? 'text-muted border-border';
  const key = `dstat.${status}` as MessageKey;
  const label = t(key) === key ? status.replace('_', ' ') : t(key);
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}
