'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { CheckIcon, LinkIcon, SearchIcon, TrashIcon } from '@/components/icons';
import type { MediaAsset } from '@/lib/cms';
import { deleteMediaAction } from '@/lib/media-actions';

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCard({ asset, canDelete }: { asset: MediaAsset; canDelete: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  function remove() {
    if (!confirm('Delete this image from the library? Stories keep their copy of the URL.')) return;
    setError(null);
    start(async () => {
      const res = await deleteMediaAction(asset.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <li className="group overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        <Image
          src={asset.url}
          alt={asset.alt ?? ''}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover"
        />
        {/* hover actions */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy URL"
            className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
          >
            {copied ? <CheckIcon size={15} /> : <LinkIcon size={15} />}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="Delete image"
              className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-accent-red disabled:opacity-50"
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="p-2.5">
        <p className="truncate font-body text-xs text-text" title={asset.alt ?? ''}>
          {asset.alt || <span className="text-faint">No alt text</span>}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-faint">
          {asset.mime.replace('image/', '').toUpperCase()} · {fileSize(asset.sizeBytes)}
        </p>
        {error && <p className="mt-1 font-mono text-[10px] text-accent-red">{error}</p>}
      </div>
    </li>
  );
}

export function MediaGrid({ assets, canDelete }: { assets: MediaAsset[]; canDelete: boolean }) {
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        (a.alt ?? '').toLowerCase().includes(q) ||
        (a.originalName ?? '').toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q),
    );
  }, [assets, query]);

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {assets.length} {assets.length === 1 ? 'image' : 'images'}
        </h2>
        <label className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <SearchIcon size={15} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search images…"
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center font-body text-sm text-muted">
          {query
            ? 'No images match your search.'
            : 'Nothing here yet — upload your first image above.'}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((asset) => (
            <MediaCard key={asset.id} asset={asset} canDelete={canDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
