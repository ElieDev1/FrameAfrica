import type { Metadata } from 'next';
import { GalleriesAdmin } from '@/components/dashboard/GalleriesAdmin';
import { fetchAdminGalleries, requirePhotographer } from '@/lib/cms';

export const metadata: Metadata = { title: 'Galleries — Frame Africa' };

export default async function GalleriesDashboardPage() {
  await requirePhotographer();
  const galleries = await fetchAdminGalleries();

  return (
    <div className="w-full">
      <GalleriesAdmin galleries={galleries} />
    </div>
  );
}
