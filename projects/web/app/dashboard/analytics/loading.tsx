import { Skeleton } from '@/components/Skeleton';

/** Analytics loading state — stat tiles, then charts and tables. */
export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
