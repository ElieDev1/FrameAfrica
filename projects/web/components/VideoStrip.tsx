import Link from 'next/link';
import { ChevronRightIcon, PlayIcon } from '@/components/icons';
import { fetchVideos } from '@/lib/videos';

/**
 * Homepage "Watch" strip (documents/06 §4.1). Renders the newsroom's latest
 * YouTube uploads from the local cache; until an editor connects the channel it
 * shows a single invitation card rather than fake teasers.
 */
export async function VideoStrip() {
  const videos = await fetchVideos(6);

  return (
    <section aria-labelledby="watch-listen" className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 id="watch-listen" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Watch
        </h2>
        <Link
          href="/videos"
          className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
        >
          All video
          <ChevronRightIcon size={12} aria-hidden />
        </Link>
      </div>

      {videos.length === 0 ? (
        <Link
          href="/videos"
          className="media-fill flex aspect-[16/5] items-center justify-center rounded-xl ring-1 ring-border"
        >
          <p className="px-6 text-center font-heading text-lg font-bold text-text">
            Video is coming to Frame Africa
          </p>
        </Link>
      ) : (
        <div className="-mx-6 flex gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]">
          {videos.map((video) => (
            <article key={video.id} className="w-64 shrink-0">
              <Link
                href="/videos"
                className="media-fill relative flex aspect-video items-center justify-center overflow-hidden rounded-xl ring-1 ring-border"
              >
                {video.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail host
                  <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute grid h-11 w-11 place-items-center rounded-full bg-black/40 pl-0.5 text-white ring-1 ring-white/30 backdrop-blur">
                  <PlayIcon size={18} />
                </span>
              </Link>
              <h3 className="mt-2 line-clamp-2 font-heading text-sm font-bold leading-snug text-text">
                {video.title}
              </h3>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
