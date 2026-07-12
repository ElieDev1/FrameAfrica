import { Skeleton } from '@/components/Skeleton';

/** Podcast episode loading state — player, title, then show notes. */
export default function EpisodeLoading() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-2 h-9 w-3/4" />
      <Skeleton className="mt-2 h-3 w-40" />
      <Skeleton className="mt-6 h-20 w-full rounded-xl" />
      <div className="mt-8 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
