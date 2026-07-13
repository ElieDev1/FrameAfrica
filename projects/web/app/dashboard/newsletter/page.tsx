import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { NewsletterAdmin } from '@/components/dashboard/NewsletterAdmin';
import { fetchNewsletterData, requireEditor } from '@/lib/cms';
import { audienceTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Newsletter — Frame Africa' };

export default async function NewsletterPage() {
  const user = await requireEditor();
  const { count, campaigns } = await fetchNewsletterData();

  return (
    <div className="w-full">
      <DashTabs tabs={audienceTabs(user.roles)} />
      <NewsletterAdmin count={count} campaigns={campaigns} />
    </div>
  );
}
