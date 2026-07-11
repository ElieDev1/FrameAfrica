'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BarChartIcon, TrashIcon } from '@/components/icons';
import { EmbedFrame } from '@/components/EmbedFrame';
import type { InteractiveItem } from '@/lib/cms';
import { createInteractive, deleteInteractive, updateInteractive } from '@/lib/interactive-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted';
const RATIOS = ['16/9', '4/3', '1/1', '3/2', '2/1'];

export function InteractiveEditor({ interactive }: { interactive?: InteractiveItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState(interactive?.title ?? '');
  const [embedUrl, setEmbedUrl] = useState(interactive?.embedUrl ?? '');
  const [description, setDescription] = useState(interactive?.description ?? '');
  const [source, setSource] = useState(interactive?.source ?? '');
  const [coverUrl, setCoverUrl] = useState(interactive?.coverUrl ?? '');
  const [aspectRatio, setAspectRatio] = useState(interactive?.aspectRatio ?? '16/9');

  const published = interactive?.status === 'published';

  function payload() {
    return {
      title: title.trim(),
      embedUrl: embedUrl.trim(),
      description: description.trim() || undefined,
      source: source.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      aspectRatio,
    };
  }

  function save() {
    if (title.trim().length < 2 || embedUrl.trim().length < 8) {
      setNotice('Add a title and a provider embed URL.');
      return;
    }
    start(async () => {
      if (interactive) {
        const res = await updateInteractive(interactive.id, payload(), interactive.slug);
        setNotice(res.error ?? 'Saved.');
        if (!res.error) router.refresh();
      } else {
        const res = await createInteractive(payload());
        if (res.error) setNotice(res.error);
        else router.push(`/dashboard/interactives/${res.id}`);
      }
    });
  }

  function togglePublish() {
    if (!interactive) return;
    start(async () => {
      const res = await updateInteractive(
        interactive.id,
        { status: published ? 'draft' : 'published' },
        interactive.slug,
      );
      setNotice(res.error ?? (published ? 'Moved to draft.' : 'Published.'));
      if (!res.error) router.refresh();
    });
  }

  function onDelete() {
    if (!interactive || !confirm(`Delete “${interactive.title}”?`)) return;
    start(async () => {
      const res = await deleteInteractive(interactive.id);
      if (res.error) setNotice(res.error);
      else router.push('/dashboard/interactives');
    });
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChartIcon size={20} className="text-primary" />
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {interactive ? 'Edit interactive' : 'New interactive'}
          </h1>
          {interactive && (
            <>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-muted ring-1 ring-border">
                {interactive.provider}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                  published
                    ? 'bg-accent-green/15 text-accent-green'
                    : 'bg-surface-2 text-muted ring-1 ring-border'
                }`}
              >
                {interactive.status}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {interactive && (
            <button
              type="button"
              onClick={togglePublish}
              disabled={pending}
              className="rounded-lg border border-border px-3 py-2 font-heading text-sm font-bold text-text transition hover:bg-surface-2 disabled:opacity-60"
            >
              {published ? 'Unpublish' : 'Publish'}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save'}
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
              <span className={label}>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
            </label>
            <label className="mt-3 block">
              <span className={label}>Embed URL</span>
              <input
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                placeholder="https://datawrapper.dwcdn.net/…, flourish, infogram, Google, YouTube"
                className={field}
              />
              <span className="mt-1 block font-mono text-[10px] text-faint">
                Only Datawrapper, Flourish, Infogram, Google (Data Studio/Looker/Sheets) and YouTube
                are accepted.
              </span>
            </label>
            <label className="mt-3 block">
              <span className={label}>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={field}
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className={label}>Source / credit</span>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className={field}
                />
              </label>
              <label>
                <span className={label}>Aspect ratio</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className={field}
                >
                  {RATIOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {interactive && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <span className={label}>Preview</span>
              <div className="mt-2">
                <EmbedFrame
                  src={interactive.embedUrl}
                  title={interactive.title}
                  aspectRatio={aspectRatio}
                />
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <span className={label}>Cover (hub thumbnail)</span>
            <div className="mt-1 aspect-video overflow-hidden rounded-lg bg-surface-2">
              {coverUrl.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Cover image URL"
              className={`${field} mt-3`}
            />
          </div>
          {interactive && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <span className={label}>Danger</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-heading text-sm font-bold text-accent-red transition hover:bg-accent-red/10 disabled:opacity-60"
              >
                <TrashIcon size={14} /> Delete
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
