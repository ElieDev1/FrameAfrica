'use client';

import { useState } from 'react';
import { PlayIcon } from '@/components/icons';

/**
 * Click-to-play YouTube embed. The iframe (privacy-preserving `youtube-nocookie`)
 * is only mounted after the reader clicks, so no third-party frame loads on page
 * view and the thumbnail stays cheap.
 */
export function VideoEmbed({
  youtubeId,
  title,
  thumbnailUrl,
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-xl ring-1 ring-border"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${title}`}
      className="media-fill relative block aspect-video w-full overflow-hidden rounded-xl ring-1 ring-border"
    >
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-black/50 pl-0.5 text-white ring-1 ring-white/30 backdrop-blur">
          <PlayIcon size={20} />
        </span>
      </span>
    </button>
  );
}
