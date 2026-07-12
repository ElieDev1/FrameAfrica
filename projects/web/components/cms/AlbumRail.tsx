'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { ImageIcon, LayersIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { MediaAlbum } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { createAlbumAction, deleteAlbumAction } from '@/lib/media-actions';

/**
 * The explorer's folder rail: All files · Unfiled · one row per event album.
 * Selecting an album is a URL change (?album=…), so the server does the filtering
 * and the view is shareable.
 */
export function AlbumRail({
  albums,
  unfiled,
  total,
  current,
  canManage,
}: {
  albums: MediaAlbum[];
  unfiled: number;
  total: number;
  /** The selected album id, the literal 'unfiled', or undefined for "All files". */
  current?: string;
  canManage: boolean;
}) {
  const t = useT();
  const ask = useConfirm();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function create() {
    setError(null);
    start(async () => {
      const res = await createAlbumAction({ name, eventDate: eventDate || undefined });
      if (res.error) setError(res.error);
      else {
        setName('');
        setEventDate('');
        setOpen(false);
      }
    });
  }

  async function remove(album: MediaAlbum) {
    const ok = await ask({
      title: album.name,
      message: t('dmg.deleteAlbumConfirm'),
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteAlbumAction(album.id);
      if (res.error) setError(res.error);
    });
  }

  const row =
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-body text-sm transition-colors';
  const active = 'bg-primary/10 font-semibold text-primary';
  const idle = 'text-muted hover:bg-surface-2 hover:text-text';

  return (
    <aside className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {t('dmg.albums')}
          </h2>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('dmg.newAlbum')}
            className="grid h-6 w-6 place-items-center rounded-md border border-border text-muted transition hover:border-primary hover:text-primary"
          >
            <PlusIcon size={12} />
          </button>
        </div>

        {open && (
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dmg.albumName')}
              maxLength={120}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
            />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              aria-label={t('dmg.eventDate')}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-text outline-none focus:border-primary"
            />
            {error && <p className="font-mono text-[10px] text-accent-red">{error}</p>}
            <button
              type="button"
              onClick={create}
              disabled={pending || !name.trim()}
              className="rounded-md bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {t('dmg.createAlbum')}
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-0.5">
          <Link href="/dashboard/media" className={`${row} ${!current ? active : idle}`}>
            <LayersIcon size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t('dmg.allFiles')}</span>
            <span className="font-mono text-[10px] text-faint">{total}</span>
          </Link>

          <Link
            href="/dashboard/media?album=unfiled"
            className={`${row} ${current === 'unfiled' ? active : idle}`}
          >
            <ImageIcon size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t('dmg.unfiled')}</span>
            <span className="font-mono text-[10px] text-faint">{unfiled}</span>
          </Link>

          {albums.length > 0 && <div className="my-1 border-t border-border" />}

          {albums.map((album) => (
            <div key={album.id} className="group/row relative">
              <Link
                href={`/dashboard/media?album=${album.id}`}
                className={`${row} ${current === album.id ? active : idle} pr-7`}
              >
                <span className="media-fill h-7 w-7 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                  {album.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- library asset
                    <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{album.name}</span>
                  {album.eventDate && (
                    <span className="block font-mono text-[10px] text-faint">
                      {formatDate(album.eventDate)}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-faint">{album.assetCount}</span>
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => remove(album)}
                  disabled={pending}
                  aria-label={t('dmg.deleteAlbum')}
                  title={t('dmg.deleteAlbum')}
                  className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-faint transition hover:text-accent-red group-hover/row:block"
                >
                  <TrashIcon size={11} />
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
