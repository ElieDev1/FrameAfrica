import { Skeleton } from '@/components/Skeleton';

/** Gallery detail loading state — title, then a masonry-ish photo grid. */
export default function GalleryDetailLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-10 w-3/4 max-w-2xl" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className={i % 5 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'} />
        ))}
      </div>
    </div>
  );
}
