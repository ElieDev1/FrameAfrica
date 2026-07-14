import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { PodcastsAdmin } from '@/components/dashboard/PodcastsAdmin';
import { fetchAdminPodcasts, requireEditor } from '@/lib/cms';
import { multimediaTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Podcasts — Frame Africa' };

export default async function PodcastsDashboardPage() {
  const user = await requireEditor();
  const shows = await fetchAdminPodcasts();
  return (
    <div className="w-full">
      <DashTabs tabs={multimediaTabs(user.roles)} />
      <PodcastsAdmin shows={shows} />
    </div>
  );
}
