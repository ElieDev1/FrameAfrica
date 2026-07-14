import { Skeleton } from '@/components/Skeleton';

/**
 * Composable loading placeholders that mirror the real layouts, so a route's
 * `loading.tsx` stays a thin arrangement of these. Everything is `aria-hidden`
 * (via `Skeleton`) and animates with the shared pulse — no new motion tokens.
 */

/** The kicker + title + search bar every multimedia hub opens with. */
export function HubHeaderSkeleton({ search = true }: { search?: boolean }) {
  return (
    <header className="border-b border-border pb-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-8 w-56" />
      {search && <Skeleton className="mt-4 h-10 w-full max-w-md" />}
    </header>
  );
}

/** A thumbnailed card: image on top, a kicker line, a title and a meta line. */
export function MediaCardSkeleton({ ratio = 'aspect-[16/10]' }: { ratio?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className={`w-full ${ratio}`} />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** A responsive grid of media cards — the body of the hub list pages. */
export function CardGridSkeleton({
  count = 8,
  ratio,
  className = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: {
  count?: number;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} ratio={ratio} />
      ))}
    </div>
  );
}

/** A single row of the "Up next" rail on the video watch page. */
function RailRowSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="aspect-video w-36 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** The YouTube-style stage (player + title) beside an "Up next" rail. */
export function VideoStageSkeleton() {
  return (
    <section className="grid gap-8 pt-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <Skeleton className="mx-auto aspect-video max-h-[calc(100dvh_-_13rem)] w-full max-w-[calc((100dvh_-_13rem)_*_16/9)] rounded-xl" />
        <Skeleton className="mt-4 h-7 w-3/4" />
        <Skeleton className="mt-2 h-3 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-2xl" />
      </div>
      <aside className="min-w-0">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RailRowSkeleton key={i} />
          ))}
        </div>
      </aside>
    </section>
  );
}

/** A stacked list of text rows — headlines, search hits, feed items. */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 py-5 first:pt-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
