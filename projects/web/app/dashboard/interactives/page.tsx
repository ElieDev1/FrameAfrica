import type { Metadata } from 'next';
import { InteractivesAdmin } from '@/components/dashboard/InteractivesAdmin';
import { fetchAdminInteractives, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Data & interactives — Frame Africa' };

export default async function InteractivesDashboardPage() {
  await requireEditor();
  const interactives = await fetchAdminInteractives();
  return (
    <div className="w-full">
      <InteractivesAdmin interactives={interactives} />
    </div>
  );
}
