import { Skeleton } from '@/components/Skeleton';

/** Homepage / public listing loading state. */
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      {/* Hero */}
      <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="mt-4 h-9 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 border-b border-border pb-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* River + rail */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[16/10] w-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
