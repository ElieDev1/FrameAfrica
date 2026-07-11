'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MailIcon, PlayIcon, PlusIcon, TrashIcon } from '@/components/icons';
import type { PodcastEpisodeItem, PodcastShowDetail } from '@/lib/cms';
import {
  createEpisode,
  createShow,
  deleteEpisode,
  deleteShow,
  updateEpisode,
  updateShow,
} from '@/lib/podcast-actions';
import { AvUploadField } from './AvUploadField';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted';

export function ShowEditor({ show }: { show?: PodcastShowDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState(show?.title ?? '');
  const [description, setDescription] = useState(show?.description ?? '');
  const [coverUrl, setCoverUrl] = useState(show?.coverUrl ?? '');
  const [spotifyUrl, setSpotifyUrl] = useState(show?.spotifyUrl ?? '');
  const [appleUrl, setAppleUrl] = useState(show?.appleUrl ?? '');
  const [rssUrl, setRssUrl] = useState(show?.rssUrl ?? '');

  const published = show?.status === 'published';

  function payload() {
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      spotifyUrl: spotifyUrl.trim() || undefined,
      appleUrl: appleUrl.trim() || undefined,
      rssUrl: rssUrl.trim() || undefined,
    };
  }

  function save() {
    if (title.trim().length < 2) {
      setNotice('Add a show title first.');
      return;
    }
    start(async () => {
      if (show) {
        const res = await updateShow(show.id, payload(), show.slug);
        setNotice(res.error ?? 'Saved.');
        if (!res.error) router.refresh();
      } else {
        const res = await createShow(payload());
        if (res.error) setNotice(res.error);
        else router.push(`/dashboard/podcasts/${res.id}`);
      }
    });
  }

  function togglePublish() {
    if (!show) return;
    start(async () => {
      const res = await updateShow(
        show.id,
        { status: published ? 'draft' : 'published' },
        show.slug,
      );
      setNotice(res.error ?? (published ? 'Moved to draft.' : 'Published.'));
      if (!res.error) router.refresh();
    });
  }

  function onDelete() {
    if (!show || !confirm(`Delete “${show.title}” and its episodes?`)) return;
    start(async () => {
      const res = await deleteShow(show.id);
      if (res.error) setNotice(res.error);
      else router.push('/dashboard/podcasts');
    });
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MailIcon size={20} className="text-primary" />
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {show ? 'Edit show' : 'New show'}
          </h1>
          {show && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                published
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'bg-surface-2 text-muted ring-1 ring-border'
              }`}
            >
              {show.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {show && (
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
        <div className="rounded-xl border border-border bg-surface p-5">
          <label className="block">
            <span className={label}>Show title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
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
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label>
              <span className={label}>Spotify</span>
              <input
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className={field}
              />
            </label>
            <label>
              <span className={label}>Apple</span>
              <input
                value={appleUrl}
                onChange={(e) => setAppleUrl(e.target.value)}
                className={field}
              />
            </label>
            <label>
              <span className={label}>RSS</span>
              <input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} className={field} />
            </label>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <span className={label}>Cover</span>
            <div className="mt-1 aspect-square overflow-hidden rounded-lg bg-surface-2">
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
          {show && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <span className={label}>Danger</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-heading text-sm font-bold text-accent-red transition hover:bg-accent-red/10 disabled:opacity-60"
              >
                <TrashIcon size={14} /> Delete show
              </button>
            </div>
          )}
        </aside>
      </div>

      {show && <EpisodesManager show={show} />}
    </div>
  );
}

function EpisodesManager({ show }: { show: PodcastShowDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'audio' | 'video'>('audio');
  const [mediaUrl, setMediaUrl] = useState('');
  const [description, setDescription] = useState('');

  function add() {
    if (title.trim().length < 2 || mediaUrl.trim().length < 3) {
      setNotice('An episode needs a title and a media URL (or uploaded file).');
      return;
    }
    start(async () => {
      const res = await createEpisode(show.id, {
        title: title.trim(),
        mediaKind: kind,
        mediaUrl: mediaUrl.trim(),
        description: description.trim() || undefined,
      });
      if (res.error) setNotice(res.error);
      else {
        setTitle('');
        setMediaUrl('');
        setDescription('');
        setNotice('Episode added as a draft.');
        router.refresh();
      }
    });
  }

  function act(fn: () => Promise<{ error?: string }>) {
    start(async () => {
      const res = await fn();
      if (res.error) setNotice(res.error);
      else router.refresh();
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <PlayIcon size={16} className="text-primary" />
        <h2 className="font-heading text-lg font-black text-text">
          Episodes ({show.episodes.length})
        </h2>
      </div>

      {/* Add episode */}
      <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <label>
            <span className={label}>Episode title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </label>
          <label>
            <span className={label}>Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'audio' | 'video')}
              className={field}
            >
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </label>
        </div>
        <div className="mt-3">
          <span className={label}>
            {kind === 'audio' ? 'Audio' : 'Video'} — paste a URL (Spotify/YouTube/host) or upload
          </span>
          <AvUploadField
            value={mediaUrl}
            onChange={setMediaUrl}
            accept={kind === 'audio' ? 'audio/*' : 'video/*'}
          />
        </div>
        <label className="mt-3 block">
          <span className={label}>Notes (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={field}
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
        >
          <PlusIcon size={15} /> Add episode
        </button>
      </div>

      {notice && (
        <p className="mt-3 font-mono text-xs text-accent-green" role="status">
          {notice}
        </p>
      )}

      {/* Episode list */}
      <ul className="mt-4 divide-y divide-border">
        {show.episodes.map((ep) => (
          <EpisodeRow key={ep.id} ep={ep} pending={pending} act={act} slug={show.slug} />
        ))}
      </ul>
    </section>
  );
}

function EpisodeRow({
  ep,
  pending,
  act,
  slug,
}: {
  ep: PodcastEpisodeItem;
  pending: boolean;
  act: (fn: () => Promise<{ error?: string }>) => void;
  slug: string;
}) {
  const published = ep.status === 'published';
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
          ep.mediaKind === 'video' ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted'
        }`}
      >
        {ep.mediaKind}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-sm font-bold text-text">{ep.title}</span>
        <span className="block truncate font-mono text-[10px] text-faint">{ep.mediaUrl}</span>
      </span>
      <span
        className={`font-mono text-[10px] uppercase ${published ? 'text-accent-green' : 'text-muted'}`}
      >
        {ep.status}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          act(() => updateEpisode(ep.id, { status: published ? 'draft' : 'published' }, slug))
        }
        className="rounded-md border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted transition hover:text-text disabled:opacity-50"
      >
        {published ? 'Unpublish' : 'Publish'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete “${ep.title}”?`)) act(() => deleteEpisode(ep.id));
        }}
        className="rounded-md border border-border p-1 text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
        aria-label="Delete episode"
      >
        <TrashIcon size={12} />
      </button>
    </li>
  );
}
