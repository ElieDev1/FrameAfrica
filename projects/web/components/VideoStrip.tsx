/**
 * Horizontal "Watch & Listen" strip (documents/06 §4.1). Placeholder items until
 * the media/video slice lands — the cards are clearly teasers (a Soon tag), not
 * live editorial links.
 */
const ITEMS = [
  { kind: 'Video', title: 'Inside Kigali’s green transport push', meta: '4:12' },
  { kind: 'Podcast', title: 'The Frame: this week in African markets', meta: '28 min' },
  { kind: 'Video', title: 'Coffee country: a season on the hills', meta: '6:40' },
  { kind: 'Podcast', title: 'Newsroom notebook — the corridor upgrade', meta: '19 min' },
  { kind: 'Video', title: 'Amavubi: the road to the qualifier', meta: '3:55' },
] as const;

export function VideoStrip() {
  return (
    <section aria-labelledby="watch-listen" className="mt-12 border-t border-border pt-8">
      <h2
        id="watch-listen"
        className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted"
      >
        Watch &amp; Listen
      </h2>
      <div className="-mx-6 flex gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]">
        {ITEMS.map((item) => (
          <article key={item.title} className="w-64 shrink-0">
            <div className="media-fill relative flex aspect-video items-center justify-center rounded-xl ring-1 ring-border">
              <span
                className="grid h-11 w-11 place-items-center rounded-full bg-black/40 text-text ring-1 ring-white/30 backdrop-blur"
                aria-hidden
              >
                ▶
              </span>
              <span className="absolute left-3 top-3 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
                {item.kind}
              </span>
              <span className="absolute right-3 top-3 rounded bg-primary/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-black">
                Soon
              </span>
            </div>
            <h3 className="mt-2 font-heading text-sm font-bold leading-snug text-text">
              {item.title}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted">{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
