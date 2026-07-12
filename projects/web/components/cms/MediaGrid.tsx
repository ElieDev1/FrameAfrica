'use client';

import { useMemo, useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import {
  ActivityIcon,
  CheckIcon,
  LinkIcon,
  PlayIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { MediaAlbum, MediaAsset } from '@/lib/cms';
import { deleteMediaAction, moveAssetAction } from '@/lib/media-actions';

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Kind = 'image' | 'video' | 'audio' | 'file';

function kindOf(mime: string): Kind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

/** The thumbnail for any file type — the explorer never shows a broken image. */
function Preview({ asset }: { asset: MediaAsset }) {
  const kind = kindOf(asset.mime);

  if (kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- library asset, arbitrary host
      <img src={asset.url} alt={asset.alt ?? ''} className="h-full w-full object-cover" />
    );
  }
  if (kind === 'video') {
    return (
      <>
        {/* preload=metadata paints the first frame as a free poster */}
        <video src={asset.url} preload="metadata" muted className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/55 pl-0.5 text-white backdrop-blur">
            <PlayIcon size={16} />
          </span>
        </span>
      </>
    );
  }
  return (
    <span className="grid h-full w-full place-items-center text-faint">
      <ActivityIcon size={26} />
    </span>
  );
}

function MediaCard({
  asset,
  albums,
  canDelete,
}: {
  asset: MediaAsset;
  albums: MediaAlbum[];
  canDelete: boolean;
}) {
  const t = useT();
  const ask = useConfirm();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const kind = kindOf(asset.mime);

  async function copy() {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the URL is still visible on the card
    }
  }

  async function remove() {
    const ok = await ask({
      message: 'Delete this file from the library? Stories keep their copy of the URL.',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    start(async () => {
      const res = await deleteMediaAction(asset.id);
      if (res.error) setError(res.error);
    });
  }

  function move(albumId: string) {
    setError(null);
    start(async () => {
      const res = await moveAssetAction(asset.id, albumId || null);
      if (res.error) setError(res.error);
    });
  }

  return (
    <li className="group overflow-hidden rounded-xl border border-border bg-surface">
      <div className="media-fill relative aspect-[4/3] w-full bg-surface-2">
        <Preview asset={asset} />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {kind}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p
          className="truncate font-heading text-sm font-semibold text-text"
          title={asset.originalName ?? asset.url}
        >
          {asset.originalName ?? asset.url.split('/').pop()}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-faint">
          {asset.mime.split('/')[1]?.toUpperCase()} · {fileSize(asset.sizeBytes)}
        </p>

        {/* File it into an event album */}
        <select
          value={asset.albumId ?? ''}
          disabled={pending}
          onChange={(e) => move(e.target.value)}
          aria-label={t('dmg.moveTo')}
          className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="">{t('dmg.unfiled')}</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.name}
            </option>
          ))}
        </select>

        {error && <p className="font-mono text-[10px] text-accent-red">{error}</p>}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copy}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary"
          >
            {copied ? <CheckIcon size={11} /> : <LinkIcon size={11} />}
            {copied ? t('dmg.copied') : t('dmg.copyUrl')}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label={t('d.common.delete')}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
            >
              <TrashIcon size={12} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function MediaGrid({
  assets,
  albums,
  canDelete,
}: {
  assets: MediaAsset[];
  albums: MediaAlbum[];
  canDelete: boolean;
}) {
  const t = useT();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        (a.originalName ?? '').toLowerCase().includes(q) ||
        (a.alt ?? '').toLowerCase().includes(q) ||
        (a.credit ?? '').toLowerCase().includes(q) ||
        a.mime.toLowerCase().includes(q),
    );
  }, [assets, query]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative w-full sm:max-w-xs">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
          <SearchIcon size={15} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('dmg.search')}
          className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
        />
      </label>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-body text-sm text-muted">{t('dmg.empty')}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((asset) => (
            <MediaCard key={asset.id} asset={asset} albums={albums} canDelete={canDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
