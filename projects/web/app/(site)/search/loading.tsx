import { Skeleton } from '@/components/Skeleton';
import { ListSkeleton } from '@/components/skeletons';

/** Search results loading state — the narrow results column. */
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-8 w-2/3" />
      <div className="mt-8">
        <ListSkeleton count={6} />
      </div>
    </div>
  );
}
