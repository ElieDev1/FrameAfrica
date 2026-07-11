'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckIcon, ClockIcon, EyeIcon, PlayIcon, PlusIcon, TrashIcon } from '@/components/icons';
import type { AdminVideoItem } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import {
  type AddVideoState,
  addVideo,
  deleteVideo,
  setVideoFlags,
  syncVideos,
} from '@/lib/video-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      <PlusIcon size={15} />
      {pending ? 'Adding…' : 'Add clip'}
    </button>
  );
}

export function VideosAdmin({ videos }: { videos: AdminVideoItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [addState, addAction] = useActionState<AddVideoState, FormData>(addVideo, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.added) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [addState.added, router]);

  function act(fn: () => Promise<{ error?: string }>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      setNotice(res.error ?? ok ?? null);
      if (!res.error) router.refresh();
    });
  }

  function onSync() {
    startTransition(async () => {
      const res = await syncVideos();
      if (res.error) setNotice(res.error);
      else if (res.reason === 'not_configured')
        setNotice('YouTube isn’t configured yet — add the API key + channel id in Settings.');
      else setNotice(`Synced ${res.synced ?? 0} clip${res.synced === 1 ? '' : 's'} from YouTube.`);
      router.refresh();
    });
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PlayIcon size={20} className="text-primary" />
            <h1 className="font-heading text-3xl font-black tracking-tight text-text">Videos</h1>
          </div>
          <p className="mt-1 font-body text-sm text-muted">
            The YouTube hub — sync the channel or curate clips by hand. {videos.length} in the
            library.
          </p>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-heading text-sm font-bold text-text transition hover:bg-surface-2 disabled:opacity-60"
        >
          <CheckIcon size={15} className="text-primary" />
          Sync from YouTube
        </button>
      </div>

      {/* Add by URL */}
      <form
        ref={formRef}
        action={addAction}
        className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="min-w-[16rem] flex-1">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            YouTube URL
          </span>
          <input name="url" required placeholder="https://youtu.be/…" className={field} />
        </label>
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Title <span className="text-faint">(optional if API key set)</span>
          </span>
          <input name="title" placeholder="Clip title" className={field} />
        </label>
        <AddButton />
      </form>

      {(notice || addState.error || addState.added) && (
        <p
          className={`mt-3 font-mono text-xs ${addState.error ? 'text-accent-red' : 'text-accent-green'}`}
          role="status"
        >
          {addState.error ?? (addState.added ? `Added “${addState.added}”.` : notice)}
        </p>
      )}

      {/* Grid */}
      {videos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-body text-sm text-muted">No videos yet.</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Sync a channel or add a clip by URL
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <article
              key={v.id}
              className={`overflow-hidden rounded-xl border border-border bg-surface ${v.isHidden ? 'opacity-60' : ''}`}
            >
              <a
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video bg-surface-2"
              >
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white">
                    <PlayIcon size={18} />
                  </span>
                </span>
                <span className="absolute left-2 top-2 flex gap-1">
                  {v.isFeatured && (
                    <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-black">
                      Featured
                    </span>
                  )}
                  {v.isHidden && (
                    <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white">
                      Hidden
                    </span>
                  )}
                </span>
              </a>

              <div className="p-3">
                <h3 className="line-clamp-2 font-heading text-sm font-bold text-text">{v.title}</h3>
                <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-faint">
                  <ClockIcon size={11} /> {formatDate(v.publishedAt)}
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      act(() => setVideoFlags(v.id, { isFeatured: !v.isFeatured }), 'Updated.')
                    }
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition disabled:opacity-50 ${
                      v.isFeatured
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted hover:text-text'
                    }`}
                  >
                    {v.isFeatured ? 'Featured' : 'Feature'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      act(() => setVideoFlags(v.id, { isHidden: !v.isHidden }), 'Updated.')
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted transition hover:text-text disabled:opacity-50"
                  >
                    <EyeIcon size={11} />
                    {v.isHidden ? 'Show' : 'Hide'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete “${v.title}” from the hub?`))
                        act(() => deleteVideo(v.id), 'Deleted.');
                    }}
                    className="ml-auto inline-flex items-center rounded-md border border-border px-2 py-1 text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
                    aria-label="Delete video"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
