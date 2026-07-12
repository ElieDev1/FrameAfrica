import { HubHeaderSkeleton, CardGridSkeleton } from '@/components/skeletons';

/** Podcasts hub loading state — header, then a grid of show cards. */
export default function PodcastsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <HubHeaderSkeleton />
      <div className="mt-8">
        <CardGridSkeleton count={6} ratio="aspect-square" />
      </div>
    </div>
  );
}
