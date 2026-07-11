import type { Metadata } from 'next';
import { PodcastsAdmin } from '@/components/dashboard/PodcastsAdmin';
import { fetchAdminPodcasts, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Podcasts — Frame Africa' };

export default async function PodcastsDashboardPage() {
  await requireEditor();
  const shows = await fetchAdminPodcasts();
  return (
    <div className="w-full">
      <PodcastsAdmin shows={shows} />
    </div>
  );
}
