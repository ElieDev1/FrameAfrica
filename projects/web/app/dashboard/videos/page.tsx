import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { VideosAdmin } from '@/components/dashboard/VideosAdmin';
import { fetchAdminVideos, requireEditor } from '@/lib/cms';
import { multimediaTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Videos — Frame Africa' };

export default async function VideosDashboardPage() {
  const user = await requireEditor();
  const videos = await fetchAdminVideos();

  return (
    <div className="w-full">
      <DashTabs tabs={multimediaTabs(user.roles)} />
      <VideosAdmin videos={videos} />
    </div>
  );
}
