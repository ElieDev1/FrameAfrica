'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ImageIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { useConfirm } from '@/components/ConfirmProvider';
import { useT } from '@/components/LocaleProvider';
import type { GalleryDetail, GalleryImage } from '@/lib/cms';
import {
  createGallery,
  deleteGallery,
  setGalleryStatus,
  updateGallery,
} from '@/lib/gallery-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

type Row = GalleryImage & { key: number };

let nextKey = 1;
function toRows(images: GalleryImage[]): Row[] {
  return images.map((im) => ({ ...im, key: nextKey++ }));
}

export function GalleryEditor({ gallery }: { gallery?: GalleryDetail }) {
  const router = useRouter();
  const t = useT();
  const ask = useConfirm();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState(gallery?.title ?? '');
  const [description, setDescription] = useState(gallery?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(gallery?.coverUrl ?? '');
  const [coverAlt, setCoverAlt] = useState(gallery?.coverAlt ?? '');
  const [rows, setRows] = useState<Row[]>(toRows(gallery?.images ?? []));

  const published = gallery?.status === 'published';

  function setRow(key: number, patch: Partial<GalleryImage>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { key: nextKey++, url: '', alt: '' }]);
  }
  function removeRow(key: number) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }
  function move(key: number, dir: -1 | 1) {
    setRows((rs) => {
      const i = rs.findIndex((r) => r.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function payload() {
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      coverAlt: coverAlt.trim() || undefined,
      images: rows
        .filter((r) => r.url.trim())
        .map((r) => ({
          url: r.url.trim(),
          alt: r.alt?.trim() ?? '',
          caption: r.caption?.trim() || undefined,
          credit: r.credit?.trim() || undefined,
        })),
    };
  }

  function save() {
    if (title.trim().length < 2) {
      setNotice(t('de.addTitleFirst'));
      return;
    }
    startTransition(async () => {
      if (gallery) {
        const res = await updateGallery(gallery.id, payload());
        setNotice(res.error ?? t('d.common.saved'));
        if (!res.error) router.refresh();
      } else {
        const res = await createGallery(payload());
        if (res.error) setNotice(res.error);
        else router.push(`/dashboard/galleries/${res.id}`);
      }
    });
  }

  function togglePublish() {
    if (!gallery) return;
    startTransition(async () => {
      const res = await setGalleryStatus(
        gallery.id,
        published ? 'draft' : 'published',
        gallery.slug,
      );
      setNotice(res.error ?? (published ? t('de.movedToDraft') : t('de.publishedMsg')));
      if (!res.error) router.refresh();
    });
  }

  async function onDelete() {
    if (!gallery) return;
    if (!(await ask({ message: `Delete “${gallery.title}”?`, danger: true }))) return;
    startTransition(async () => {
      const res = await deleteGallery(gallery.id);
      if (res.error) setNotice(res.error);
      else router.push('/dashboard/galleries');
    });
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={20} className="text-primary" />
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {gallery ? t('dgal.editGallery') : t('dgal.newGallery')}
          </h1>
          {gallery && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                published
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'bg-surface-2 text-muted ring-1 ring-border'
              }`}
            >
              {t(published ? 'd.common.published' : 'd.common.draft')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gallery && (
            <button
              type="button"
              onClick={togglePublish}
              disabled={pending}
              className="rounded-lg border border-border px-3 py-2 font-heading text-sm font-bold text-text transition hover:bg-surface-2 disabled:opacity-60"
            >
              {published ? t('d.common.unpublish') : t('d.common.publish')}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t('d.common.saving') : t('d.common.save')}
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-3 font-mono text-xs text-accent-green" role="status">
          {notice}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                {t('d.common.title')}
              </span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                {t('d.common.description')}
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={field}
              />
            </label>
          </div>

          {/* Photos */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {t('dgal.photosHeading')} ({rows.length})
              </h2>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 font-heading text-xs font-bold text-text transition hover:bg-surface-2"
              >
                <PlusIcon size={13} /> {t('dgal.addPhoto')}
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="mt-4 font-body text-sm text-muted">{t('dgal.noPhotos')}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {rows.map((r, i) => (
                  <li
                    key={r.key}
                    className="flex gap-3 rounded-lg border border-border bg-surface-2 p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface">
                      {r.url.trim() && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <input
                        value={r.url}
                        onChange={(e) => setRow(r.key, { url: e.target.value })}
                        placeholder={t('de.imageUrl')}
                        className={`${field} sm:col-span-2`}
                      />
                      <input
                        value={r.alt}
                        onChange={(e) => setRow(r.key, { alt: e.target.value })}
                        placeholder={t('de.altText')}
                        className={field}
                      />
                      <input
                        value={r.credit ?? ''}
                        onChange={(e) => setRow(r.key, { credit: e.target.value })}
                        placeholder={t('de.credit')}
                        className={field}
                      />
                      <input
                        value={r.caption ?? ''}
                        onChange={(e) => setRow(r.key, { caption: e.target.value })}
                        placeholder={t('de.caption')}
                        className={`${field} sm:col-span-2`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(r.key, -1)}
                        disabled={i === 0}
                        className="rounded border border-border px-1.5 text-xs text-muted disabled:opacity-30"
                        aria-label={t('de.moveUp')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(r.key, 1)}
                        disabled={i === rows.length - 1}
                        className="rounded border border-border px-1.5 text-xs text-muted disabled:opacity-30"
                        aria-label={t('de.moveDown')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(r.key)}
                        className="mt-1 rounded border border-border p-1 text-muted transition hover:border-accent-red hover:text-accent-red"
                        aria-label={t('dgal.removePhoto')}
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: cover + danger */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t('d.common.cover')}
            </h2>
            <div className="mt-3 aspect-video overflow-hidden rounded-lg bg-surface-2">
              {coverUrl.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder={t('de.coverUrl')}
              className={`${field} mt-3`}
            />
            <input
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              placeholder={t('de.coverAlt')}
              className={`${field} mt-2`}
            />
          </div>

          {gallery && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {t('d.common.danger')}
              </h2>
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-heading text-sm font-bold text-accent-red transition hover:bg-accent-red/10 disabled:opacity-60"
              >
                <TrashIcon size={14} /> {t('dgal.deleteGallery')}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
