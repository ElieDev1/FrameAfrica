import { HubHeaderSkeleton, CardGridSkeleton } from '@/components/skeletons';

/** Interactives hub loading state — header, then a grid of interactive cards. */
export default function InteractivesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-4">
      <HubHeaderSkeleton />
      <div className="mt-8">
        <CardGridSkeleton count={6} ratio="aspect-[16/10]" />
      </div>
    </div>
  );
}
