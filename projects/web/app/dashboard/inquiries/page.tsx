import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { InquiriesAdmin } from '@/components/dashboard/InquiriesAdmin';
import { fetchInquiries, requireAdmin } from '@/lib/cms';
import { audienceTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Inquiries — Frame Africa' };

export default async function InquiriesPage() {
  const user = await requireAdmin();
  const inquiries = await fetchInquiries();

  return (
    <div className="w-full">
      <DashTabs tabs={audienceTabs(user.roles)} />
      <InquiriesAdmin inquiries={inquiries} />
    </div>
  );
}
