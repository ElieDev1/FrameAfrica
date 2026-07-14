import { Skeleton } from '@/components/Skeleton';

/** Interactive detail loading state — title, then the embed canvas. */
export default function InteractiveDetailLoading() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-9 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <Skeleton className="mt-6 aspect-[16/9] w-full rounded-xl" />
    </div>
  );
}
