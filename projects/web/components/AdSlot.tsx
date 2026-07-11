import { type AdPlacement, fetchHouseAd, PUBLIC_API_URL } from '@/lib/ads';

/**
 * Advertisement slot. Always labelled "Advertisement" and visually distinct from
 * editorial cards (documents/06 §4.1). Serves an admin-managed **house ad** for
 * the placement, falling back to a house creative when none is booked. A real
 * ad-sales server is the later swap behind `fetchHouseAd`.
 */
const SHAPE: Record<AdPlacement, string> = {
  leaderboard: 'h-24 md:h-28',
  billboard: 'h-28 md:h-[250px]',
  rectangle: 'aspect-[6/5]',
  halfpage: 'aspect-[1/2]',
  native: 'aspect-[16/9]',
};

/** A video creative (animated/motion ad) vs a static image. */
function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export async function AdSlot({
  variant = 'leaderboard',
  className = '',
  sticky = false,
}: {
  variant?: AdPlacement;
  className?: string;
  sticky?: boolean;
}) {
  const ad = await fetchHouseAd(variant);

  return (
    <aside
      aria-label="Advertisement"
      className={`flex flex-col gap-1 ${sticky ? 'lg:sticky lg:top-24' : ''} ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Advertisement
      </span>
      {ad ? (
        <a
          href={`${PUBLIC_API_URL}/ads/${ad.id}/go`}
          target="_blank"
          rel="noopener sponsored"
          className={`block overflow-hidden rounded-xl ring-1 ring-border ${SHAPE[variant]}`}
        >
          {ad.imageUrl && isVideo(ad.imageUrl) ? (
            <video
              src={ad.imageUrl}
              autoPlay
              muted
              loop
              playsInline
              aria-label={ad.title}
              className="h-full w-full object-cover"
            />
          ) : ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- ad creatives are arbitrary external hosts
            <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
          ) : (
            <div className="media-fill flex h-full items-center justify-center">
              <p className="px-6 text-center font-heading text-lg font-bold text-text">
                {ad.title}
              </p>
            </div>
          )}
        </a>
      ) : (
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
      )}
    </aside>
  );
}
