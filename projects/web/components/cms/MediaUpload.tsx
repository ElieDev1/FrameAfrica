'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ActivityIcon, CloseIcon, ImageIcon, PlayIcon, PlusIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import { uploadMediaAction, type UploadState } from '@/lib/media-actions';

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav';

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

/** A file the user has picked but not yet uploaded, with its preview URL. */
interface Picked {
  file: File;
  url: string;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The thumbnail for a pending file — so you see exactly what you're sending. */
function Thumb({ picked }: { picked: Picked }) {
  const { file, url } = picked;
  if (file.type.startsWith('image/')) {
    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
    return <img src={url} alt="" className="h-full w-full object-cover" />;
  }
  if (file.type.startsWith('video/')) {
    return (
      <>
        <video src={url} preload="metadata" muted className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/55 pl-0.5 text-white">
            <PlayIcon size={13} />
          </span>
        </span>
      </>
    );
  }
  return (
    <span className="grid h-full w-full place-items-center text-faint">
      <ActivityIcon size={20} />
    </span>
  );
}

/**
 * Upload any file to the library — image (≤8 MB) or audio/video (≤200 MB), one
 * or many. Files are previewed before sending, and land in `albumId` when the
 * explorer has an album open.
 */
export function MediaUpload({ albumId, albumName }: { albumId?: string; albumName?: string }) {
  const t = useT();
  const [state, setState] = useState<UploadState>({});
  const [pending, startUpload] = useTransition();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const creditRef = useRef<HTMLInputElement>(null);

  /** Object URLs are created in handlers (never during render) and revoked here. */
  useEffect(() => {
    return () => {
      for (const p of picked) URL.revokeObjectURL(p.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only cleanup
  }, []);

  function add(list: FileList | null) {
    if (!list?.length) return;
    setPicked((prev) => {
      const next = [...prev];
      for (const file of Array.from(list)) {
        const dupe = next.some((p) => p.file.name === file.name && p.file.size === file.size);
        if (!dupe) next.push({ file, url: URL.createObjectURL(file) });
      }
      return next;
    });
  }

  function removeAt(index: number) {
    setPicked((prev) => {
      const gone = prev[index];
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearAll() {
    setPicked((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.url);
      return [];
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  function upload() {
    if (picked.length === 0) return;
    const body = new FormData();
    for (const p of picked) body.append('file', p.file);
    if (albumId) body.set('albumId', albumId);
    const alt = altRef.current?.value.trim();
    const credit = creditRef.current?.value.trim();
    if (alt) body.set('alt', alt);
    if (credit) body.set('credit', credit);

    const sent = picked;
    startUpload(async () => {
      const result = await uploadMediaAction({}, body);
      setState(result);
      // Clear the tray only for a batch that actually landed, so a failed
      // upload keeps the user's selection to retry.
      if (result.uploadedCount) {
        for (const p of sent) URL.revokeObjectURL(p.url);
        setPicked([]);
        if (fileRef.current) fileRef.current.value = '';
        if (altRef.current) altRef.current.value = '';
        if (creditRef.current) creditRef.current.value = '';
      }
    });
  }

  const totalBytes = picked.reduce((sum, p) => sum + p.file.size, 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {t('dmg.anyFile')}
          {albumName && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] normal-case tracking-normal text-primary">
              → {albumName}
            </span>
          )}
        </span>
        {picked.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="font-mono text-[10px] uppercase tracking-wide text-faint transition hover:text-accent-red disabled:opacity-50"
          >
            {t('dmg.clearAll')}
          </button>
        )}
      </div>

      {/* Drop zone / picker */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-6 transition ${
          dragging
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-surface-2 text-faint hover:border-primary hover:text-primary'
        }`}
      >
        <ImageIcon size={22} />
        <span className="font-body text-sm font-semibold">{t('dmg.dropHere')}</span>
        <span className="font-mono text-[10px] text-faint">{t('dmg.sizeHint')}</span>
      </button>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={(e) => add(e.target.files)}
        className="hidden"
      />

      {/* Preview tray — exactly what will be sent */}
      {picked.length > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[11px] font-bold text-text">
              {picked.length} {t('dmg.filesSelected')}
            </span>
            <span className="font-mono text-[10px] text-faint">{humanSize(totalBytes)}</span>
          </div>

          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {picked.map((p, i) => (
              <li
                key={`${p.file.name}-${p.file.size}`}
                className="group relative overflow-hidden rounded-lg border border-border bg-surface-2"
              >
                <div className="media-fill relative aspect-square w-full">
                  <Thumb picked={p} />
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    disabled={pending}
                    aria-label={t('dmg.removeFile')}
                    title={t('dmg.removeFile')}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-md bg-black/60 text-white backdrop-blur transition hover:bg-accent-red disabled:opacity-50"
                  >
                    <CloseIcon size={11} />
                  </button>
                </div>
                <div className="p-1.5">
                  <p className="truncate font-mono text-[10px] text-text" title={p.file.name}>
                    {p.file.name}
                  </p>
                  <p className="font-mono text-[9px] text-faint">{humanSize(p.file.size)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Shared metadata for the batch */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={altRef}
          name="alt"
          placeholder={picked.length > 1 ? t('dmg.altBatchHint') : t('de.altText')}
          disabled={picked.length > 1}
          maxLength={400}
          className={`${input} disabled:opacity-50`}
          style={{ flex: 2 }}
        />
        <input
          ref={creditRef}
          name="credit"
          placeholder={t('de.credit')}
          maxLength={200}
          className={input}
          style={{ flex: 1 }}
        />
      </div>

      {/* A batch can partly succeed — show both sides. */}
      {state.uploadedCount ? (
        <p className="font-mono text-xs text-accent-green">
          {state.uploadedCount} {t('dmg.uploadedOk')}
        </p>
      ) : null}
      {state.error && (
        <p role="alert" className="font-mono text-xs leading-snug text-accent-red">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={upload}
          disabled={pending || picked.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          <PlusIcon size={15} />
          {pending
            ? t('d.common.uploading')
            : picked.length > 1
              ? `${t('d.common.upload')} ${picked.length}`
              : t('d.common.upload')}
        </button>
      </div>
    </div>
  );
}
