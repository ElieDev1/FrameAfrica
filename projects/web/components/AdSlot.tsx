/**
 * Advertisement slot. Always labelled "Advertisement" and visually distinct from
 * editorial cards (documents/06 §4.1). Shows a house ad until a real ad server
 * (Slice 8) is wired; `variant` picks the standard IAB shape.
 * - leaderboard  728×90 / 970×90   (top of page, between sections)
 * - billboard    970×250           (before footer)
 * - rectangle    300×250           (in rail / in-content)
 * - halfpage     300×600 sticky    (rail, high viewability)
 * - native       fluid             (in-feed, styled as content but labelled)
 */
type Variant = 'leaderboard' | 'billboard' | 'rectangle' | 'halfpage' | 'native';

const SHAPE: Record<Variant, string> = {
  leaderboard: 'h-24 md:h-28',
  billboard: 'h-28 md:h-[250px]',
  rectangle: 'aspect-[6/5]',
  halfpage: 'aspect-[1/2]',
  native: 'aspect-[16/9]',
};

export function AdSlot({
  variant = 'leaderboard',
  className = '',
  sticky = false,
}: {
  variant?: Variant;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <aside
      aria-label="Advertisement"
      className={`flex flex-col gap-1 ${sticky ? 'lg:sticky lg:top-24' : ''} ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Advertisement
      </span>
      <div
        className={`media-fill flex items-center justify-center rounded-xl ring-1 ring-border ${SHAPE[variant]}`}
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
