import { Skeleton } from '@/components/Skeleton';
import { CardGridSkeleton } from '@/components/skeletons';

/** "For you" personalised feed loading state. */
export default function ForYouLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-10">
        <CardGridSkeleton count={9} />
      </div>
    </div>
  );
}
