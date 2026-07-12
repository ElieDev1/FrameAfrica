'use client';

import { useRef, useState } from 'react';
import { PlayIcon } from '@/components/icons';
import { InlineVideoEngagement } from '@/components/InlineVideoEngagement';
import { useT } from '@/components/LocaleProvider';
import { formatDate } from '@/lib/format';
import type { VideoItem } from '@/lib/videos';

function thumb(video: VideoItem): string {
  return video.thumbnailUrl ?? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
}

/**
 * The video hub, YouTube-style: one main stage plus a playlist. Selecting any
 * clip — in the "Up next" rail or the grid below — swaps it into the stage and
 * starts it, rather than opening a separate page.
 */
export function VideoHub({ videos, initialId }: { videos: VideoItem[]; initialId?: string }) {
  const t = useT();
  // On a watch page (`/videos/:id`) start on that clip and autoplay it, like
  // YouTube; on the hub it defaults to the newest clip, paused.
  const [current, setCurrent] = useState(
    () => (initialId && videos.find((v) => v.id === initialId)) || videos[0],
  );
  const [playing, setPlaying] = useState(Boolean(initialId));
  const stageRef = useRef<HTMLDivElement>(null);

  function select(video: VideoItem) {
    setCurrent(video);
    setPlaying(true); // a deliberate click means "play it", like YouTube
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const rail = videos.filter((v) => v.id !== current.id);

  return (
    <>
      <section className="grid gap-8 pt-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        {/* ── Stage ── */}
        <div ref={stageRef} className="min-w-0 scroll-mt-24">
          {playing ? (
            <iframe
              key={current.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              // Cap to the viewport (minus navbar + header) so the whole player
              // is visible without scrolling; it centres and keeps 16:9.
              className="mx-auto aspect-video max-h-[calc(100dvh_-_13rem)] w-full max-w-[calc((100dvh_-_13rem)_*_16/9)] ring-1 ring-border"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`${t('mm.play')}: ${current.title}`}
              className="media-fill relative mx-auto block aspect-video max-h-[calc(100dvh_-_13rem)] w-full max-w-[calc((100dvh_-_13rem)_*_16/9)] overflow-hidden ring-1 ring-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host */}
              <img src={thumb(current)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-black/55 pl-0.5 text-white ring-1 ring-white/30 backdrop-blur">
                  <PlayIcon size={24} />
                </span>
              </span>
            </button>
          )}

          <h2 className="mt-3 font-heading text-2xl font-black leading-tight tracking-tight text-text">
            {current.title}
          </h2>
          <span className="mt-1 block font-mono text-[11px] text-faint">
            {formatDate(current.publishedAt)}
          </span>
          {current.description && (
            <p className="mt-2 max-w-3xl whitespace-pre-line font-body leading-relaxed text-muted">
              {current.description}
            </p>
          )}

          {/* Like / share / comment for the clip on the stage, in place. */}
          <InlineVideoEngagement type="video" id={current.id} path="/videos" />
        </div>

        {/* ── Up next ── */}
        {rail.length > 0 && (
          <aside className="min-w-0">
            <h2 className="mb-4 flex items-center gap-2.5 border-b border-border pb-2 font-heading text-sm font-black uppercase tracking-tight text-text">
              <span aria-hidden className="h-3.5 w-1 rounded-full bg-primary" />
              {t('mm.upNext')}
            </h2>
            <ul className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
              {rail.map((video) => (
                <li key={video.id}>
                  <button
                    type="button"
                    onClick={() => select(video)}
                    className="group flex w-full gap-3 rounded-lg p-1 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="media-fill relative aspect-video w-36 shrink-0 overflow-hidden ring-1 ring-border">
                      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host */}
                      <img
                        src={thumb(video)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-black/60 pl-0.5 text-white">
                          <PlayIcon size={14} />
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-3 block font-heading text-sm font-bold leading-snug text-text group-hover:text-primary">
                        {video.title}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] text-faint">
                        {formatDate(video.publishedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {/* ── Full grid — also feeds the stage ── */}
      {videos.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-5 flex items-center gap-2.5 border-b border-border pb-2 font-heading text-lg font-black uppercase tracking-tight text-text">
            <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
            {t('mm.allVideos')}
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => {
              const active = video.id === current.id;
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => select(video)}
                  className="group min-w-0 text-left"
                >
                  <span className="media-fill relative block aspect-video overflow-hidden ring-1 ring-border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host */}
                    <img
                      src={thumb(video)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 pl-0.5 text-white backdrop-blur">
                        <PlayIcon size={18} />
                      </span>
                    </span>
                    {active && (
                      <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-black">
                        {t('mm.nowPlaying')}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 block font-heading text-base font-bold leading-snug text-text group-hover:text-primary">
                    {video.title}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-faint">
                    {formatDate(video.publishedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
