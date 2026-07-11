'use client';

import { useRef, useState } from 'react';
import { uploadAVAction } from '@/lib/media-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

/**
 * Media URL input with an "Upload" button. Staff can paste an external URL
 * (Spotify/YouTube/host) or upload an audio/video file to our storage; either
 * way the resolved URL is reported back via `onChange`.
 */
export function AvUploadField({
  value,
  onChange,
  accept = 'audio/*,video/*',
  placeholder = 'Media URL, or upload a file →',
}: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadAVAction(fd);
    setBusy(false);
    if (res.error) setError(res.error);
    else if (res.url) onChange(res.url);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={field}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-lg border border-border px-3 py-2 font-heading text-xs font-bold text-text transition hover:bg-surface-2 disabled:opacity-60"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={inputRef} type="file" accept={accept} onChange={onFile} className="hidden" />
      </div>
      {error && <p className="mt-1 font-mono text-[11px] text-accent-red">{error}</p>}
    </div>
  );
}
