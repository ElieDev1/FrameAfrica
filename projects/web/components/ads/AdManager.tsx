'use client';

import { useState, useTransition } from 'react';
import type { HouseAdAdmin } from '@/lib/cms';
import { createHouseAd, deleteHouseAd, toggleHouseAd } from '@/lib/ads-actions';

const PLACEMENTS = ['leaderboard', 'billboard', 'rectangle', 'halfpage', 'native'] as const;

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

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={onCreate} className="rounded-xl border border-border p-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">New house ad</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (shown if no image)"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as (typeof PLACEMENTS)[number])}
            className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
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
            className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
          />
        </div>
        {error && <p className="mt-2 font-mono text-[11px] text-accent-red">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-3 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Add house ad'}
        </button>
      </form>

      <div>
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          House ads ({ads.length})
        </h2>
        {ads.length === 0 ? (
          <p className="mt-3 font-body text-sm text-muted">No house ads yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {ads.map((ad) => (
              <AdRow key={ad.id} ad={ad} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AdRow({ ad }: { ad: HouseAdAdmin }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${ad.isActive ? 'bg-accent-green' : 'bg-faint'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-bold text-text">{ad.title}</p>
        <p className="truncate font-mono text-[11px] text-muted">
          {ad.placement} · {ad.impressions} impr · {ad.clicks} clicks
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleHouseAd(ad.id, !ad.isActive))}
        className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted hover:text-text disabled:opacity-50"
      >
        {ad.isActive ? 'Pause' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteHouseAd(ad.id))}
        className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-accent-red hover:bg-accent-red/10 disabled:opacity-50"
      >
        Delete
      </button>
    </li>
  );
}
