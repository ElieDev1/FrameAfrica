import { CardGridSkeleton, VideoStageSkeleton } from '@/components/skeletons';

/** Video watch page loading state — same stage + rail + grid as the hub. */
export default function VideoWatchLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <VideoStageSkeleton />
      <div className="mt-12">
        <CardGridSkeleton count={8} ratio="aspect-video" />
      </div>
    </div>
  );
}
