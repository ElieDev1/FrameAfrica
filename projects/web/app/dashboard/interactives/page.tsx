import type { Metadata } from 'next';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { InteractivesAdmin } from '@/components/dashboard/InteractivesAdmin';
import { fetchAdminInteractives, requireEditor } from '@/lib/cms';
import { multimediaTabs } from '@/lib/dash-tabs';

export const metadata: Metadata = { title: 'Data & interactives — Frame Africa' };

export default async function InteractivesDashboardPage() {
  const user = await requireEditor();
  const interactives = await fetchAdminInteractives();
  return (
    <div className="w-full">
      <DashTabs tabs={multimediaTabs(user.roles)} />
      <InteractivesAdmin interactives={interactives} />
    </div>
  );
}
