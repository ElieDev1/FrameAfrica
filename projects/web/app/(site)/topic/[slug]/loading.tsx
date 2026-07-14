import { Skeleton } from '@/components/Skeleton';
import { CardGridSkeleton } from '@/components/skeletons';

/** Topic page loading state — mirrors the section listing. */
export default function TopicLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96" />
      <div className="mt-8">
        <CardGridSkeleton
          count={9}
          className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    </div>
  );
}
