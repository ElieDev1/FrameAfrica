'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadMediaAction } from '@/lib/media-actions';

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition disabled:opacity-60"
    >
      {pending ? 'Uploading…' : 'Upload'}
    </button>
  );
}

/** Upload an image to the media library (JPEG/PNG/WebP/GIF/AVIF, ≤8 MB). */
export function MediaUpload() {
  const [state, formAction] = useActionState(uploadMediaAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form after a successful upload so the next one starts clean.
  useEffect(() => {
    if (state.uploadedUrl) formRef.current?.reset();
  }, [state.uploadedUrl]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">Image file</span>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          required
          className="font-body text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-primary"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          name="alt"
          placeholder="Alt text (accessibility)"
          maxLength={400}
          className={input}
          style={{ flex: 2 }}
        />
        <input
          name="credit"
          placeholder="Credit"
          maxLength={200}
          className={input}
          style={{ flex: 1 }}
        />
      </div>

      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      {state.uploadedUrl && <p className="font-mono text-xs text-accent-green">Uploaded ✓</p>}

      <div>
        <UploadButton />
      </div>
    </form>
  );
}
