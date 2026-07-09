import { Skeleton } from '@/components/Skeleton';

export default function SectionLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96" />
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[16/10] w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
