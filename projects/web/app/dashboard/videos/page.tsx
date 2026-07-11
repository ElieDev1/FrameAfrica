import type { Metadata } from 'next';
import { VideosAdmin } from '@/components/dashboard/VideosAdmin';
import { fetchAdminVideos, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Videos — Frame Africa' };

export default async function VideosDashboardPage() {
  await requireEditor();
  const videos = await fetchAdminVideos();

  return (
    <div className="w-full">
      <VideosAdmin videos={videos} />
    </div>
  );
}
