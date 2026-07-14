import { Skeleton } from '@/components/Skeleton';
import { ListSkeleton } from '@/components/skeletons';

/** Podcast show loading state — show art sidebar + episode list. */
export default function PodcastShowLoading() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </aside>
      <div>
        <Skeleton className="h-4 w-32" />
        <div className="mt-6">
          <ListSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}
