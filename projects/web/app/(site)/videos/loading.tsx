import { HubHeaderSkeleton, VideoStageSkeleton, CardGridSkeleton } from '@/components/skeletons';

/** Video hub loading state — header, then the stage + "Up next" rail, then a grid. */
export default function VideosLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <HubHeaderSkeleton />
      <VideoStageSkeleton />
      <div className="mt-12">
        <CardGridSkeleton count={8} ratio="aspect-video" />
      </div>
    </div>
  );
}
