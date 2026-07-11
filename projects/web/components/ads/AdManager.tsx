'use client';

import { useState, useTransition } from 'react';
import { TrashIcon } from '@/components/icons';
import { createHouseAd, deleteHouseAd, toggleHouseAd } from '@/lib/ads-actions';
import type { HouseAdAdmin } from '@/lib/cms';

const PLACEMENTS = ['leaderboard', 'billboard', 'rectangle', 'halfpage', 'native'] as const;

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

/** Small preview of an image / GIF / video creative. */
function Creative({
  url,
  title,
  className = '',
}: {
  url: string;
  title: string;
  className?: string;
}) {
  if (isVideo(url)) {
    return (
      <video src={url} muted loop autoPlay playsInline className={`object-cover ${className}`} />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- ad creatives are arbitrary hosts
  return <img src={url} alt={title} className={`object-cover ${className}`} />;
}

export function AdManager({ ads }: { ads: HouseAdAdmin[] }) {
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [placement, setPlacement] = useState<(typeof PLACEMENTS)[number]>('leaderboard');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createHouseAd({
        title,
        linkUrl,
        imageUrl: imageUrl || undefined,
        placement,
      });
      if (res.ok) {
        setTitle('');
        setLinkUrl('');
        setImageUrl('');
      } else {
        setError(res.error ?? 'Something went wrong.');
      }
    });
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      {/* ---- Ad list ---- */}
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Live &amp; paused ({ads.length})
        </h2>
        {ads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="font-heading text-lg font-bold text-text">No house ads yet</p>
            <p className="mt-1 font-body text-sm text-muted">
              Create one on the right, or design one in the Ad Studio.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {ads.map((ad) => (
              <AdRow key={ad.id} ad={ad} />
            ))}
          </ul>
        )}
      </div>

      {/* ---- Create form ---- */}
      <form
        onSubmit={onCreate}
        className="rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20"
      >
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">New house ad</h2>

        {imageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-border">
            <Creative url={imageUrl} title={title} className="h-28 w-full" />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (shown if no image)"
            className={inputCls}
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as (typeof PLACEMENTS)[number])}
            className={inputCls}
          >
            {PLACEMENTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            required
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://advertiser.example"
            className={inputCls}
          />
          <label className="flex flex-col gap-1">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image, GIF or video URL (or /uploads/… path)"
              className={inputCls}
            />
            <span className="font-mono text-[10px] text-faint">
              jpg · png · gif · mp4 · webm — videos autoplay muted &amp; loop
            </span>
          </label>
        </div>
        {error && <p className="mt-2 font-mono text-[11px] text-accent-red">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-3 w-full rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Add house ad'}
        </button>
      </form>
    </div>
  );
}

function AdRow({ ad }: { ad: HouseAdAdmin }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-surface-2 ring-1 ring-border">
        {ad.imageUrl ? (
          <Creative url={ad.imageUrl} title={ad.title} className="h-full w-full" />
        ) : (
          <span className="media-fill absolute inset-0" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${ad.isActive ? 'bg-accent-green' : 'bg-faint'}`}
          />
          <span className="truncate font-heading text-sm font-bold text-text">{ad.title}</span>
          {ad.imageUrl && isVideo(ad.imageUrl) && (
            <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted">
              Video
            </span>
          )}
        </p>
        <p className="truncate font-mono text-[11px] text-muted">
          {ad.placement} · {ad.impressions} impr · {ad.clicks} clicks
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleHouseAd(ad.id, !ad.isActive))}
        className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted transition hover:border-primary hover:text-text disabled:opacity-50"
      >
        {ad.isActive ? 'Pause' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteHouseAd(ad.id))}
        aria-label="Delete ad"
        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
      >
        <TrashIcon size={14} />
      </button>
    </li>
  );
}
