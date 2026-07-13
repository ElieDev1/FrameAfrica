import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { GalleriesAdmin } from '@/components/dashboard/GalleriesAdmin';
import { fetchAdminGalleries, requirePhotographer } from '@/lib/cms';
import { multimediaTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Galleries — Frame Africa' };

export default async function GalleriesDashboardPage() {
  const user = await requirePhotographer();
  const galleries = await fetchAdminGalleries();

  return (
    <div className="w-full">
      <DashTabs tabs={multimediaTabs(user.roles)} />
      <GalleriesAdmin galleries={galleries} />
    </div>
  );
}
