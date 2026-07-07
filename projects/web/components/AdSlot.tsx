/**
 * Advertisement slot. Always labelled "Advertisement" and visually distinct from
 * editorial cards (documents/06 §4.1). Shows a house ad until a real ad server
 * (Slice 8) is wired; `variant` picks the standard IAB-ish shape.
 */
export function AdSlot({
  variant = 'leaderboard',
  className = '',
}: {
  variant?: 'leaderboard' | 'rectangle';
  className?: string;
}) {
  const isLeaderboard = variant === 'leaderboard';
  return (
    <aside aria-label="Advertisement" className={`flex flex-col gap-1 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Advertisement
      </span>
      <div
        className={`media-fill flex items-center justify-center rounded-xl ring-1 ring-border ${
          isLeaderboard ? 'h-24 md:h-28' : 'aspect-[4/5]'
        }`}
      >
        <div className="px-6 text-center">
          <p className="font-heading text-lg font-bold text-text">Advertise with Frame Africa</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Reach readers across Rwanda &amp; Africa
          </p>
        </div>
      </div>
    </aside>
  );
}
