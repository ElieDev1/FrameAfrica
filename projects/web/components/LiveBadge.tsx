/**
 * A small "Live" indicator with a pulsing dot (or a muted "Unavailable" when
 * data couldn't be fetched). Used on the Weather/Markets widgets.
 */
export function LiveBadge({ live }: { live: boolean }) {
  if (!live) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        Unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-green">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
      </span>
      Live
    </span>
  );
}
