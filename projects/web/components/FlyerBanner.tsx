import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/icons';
import { fetchHouseAd, PUBLIC_API_URL } from '@/lib/ads';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

/** A video creative (motion flyer) vs a static image. */
function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

/**
 * The homepage flyer — the first thing a reader sees, and the most saleable slot
 * on the site. It is a `flyer`-placement house ad, so it inherits the admin CRUD,
 * the active toggle, impressions and click-through tracking that every other ad
 * already has (Dashboard → House ads; design one in Flyer Studio at 1600×400).
 *
 * Two deliberate choices:
 *
 * - It is **always labelled**, never dressed as editorial (documents/06 §4.1).
 * - With nothing booked it does not leave a dead grey box at the top of the
 *   paper: it becomes a compact "advertise here" pitch, so an empty slot is
 *   still selling itself.
 */
export async function FlyerBanner() {
  const [ad, locale] = await Promise.all([fetchHouseAd('flyer'), getLocale()]);

  if (!ad) {
    return (
      <aside
        aria-label={t(locale, 'flyer.availableAria')}
        className="mx-auto max-w-[1440px] px-6 pt-4"
      >
        <Link
          href="/advertise"
          className="group flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-surface px-5 py-3 transition hover:border-primary"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {t(locale, 'flyer.label')}
            </span>
            <span className="mt-0.5 block truncate font-heading text-sm font-bold text-text">
              {t(locale, 'flyer.pitch')}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black transition group-hover:opacity-90">
            {t(locale, 'flyer.cta')}
            <ArrowUpRightIcon size={12} />
          </span>
        </Link>
      </aside>
    );
  }

  return (
    <aside aria-label="Advertisement" className="mx-auto max-w-[1440px] px-6 pt-4">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        {t(locale, 'flyer.label')}
      </span>
      <a
        href={`${PUBLIC_API_URL}/ads/${ad.id}/go`}
        target="_blank"
        rel="noopener sponsored"
        className="block h-36 overflow-hidden rounded-xl ring-1 ring-border transition hover:ring-primary sm:h-44 md:h-56"
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
          // eslint-disable-next-line @next/next/no-img-element -- creatives come from arbitrary hosts
          <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
        ) : (
          <div className="media-fill flex h-full items-center justify-center">
            <p className="px-6 text-center font-heading text-2xl font-black text-text">
              {ad.title}
            </p>
          </div>
        )}
      </a>
    </aside>
  );
}
