const STYLES: Record<string, string> = {
  draft: 'text-muted border-border',
  in_progress: 'text-accent-yellow border-accent-yellow',
  ready: 'text-primary border-primary',
  rejected: 'text-accent-red border-accent-red',
  published: 'text-accent-green border-accent-green',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? 'text-muted border-border';
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
