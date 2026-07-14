import { HubHeaderSkeleton, MediaCardSkeleton, CardGridSkeleton } from '@/components/skeletons';

/** Galleries hub loading state — a wide lead, then a tiled grid. */
export default function GalleriesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <HubHeaderSkeleton />
      <div className="mt-6">
        <MediaCardSkeleton ratio="aspect-[21/9]" />
      </div>
      <div className="mt-10">
        <CardGridSkeleton count={8} ratio="aspect-[4/3]" />
      </div>
    </div>
  );
}
