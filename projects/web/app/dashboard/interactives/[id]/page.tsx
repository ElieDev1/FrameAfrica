import type { Metadata } from 'next';
import { InteractiveEditor } from '@/components/dashboard/InteractiveEditor';
import { fetchAdminInteractive, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Edit interactive — Frame Africa' };

export default async function EditInteractivePage({ params }: { params: Promise<{ id: string }> }) {
  await requireEditor();
  const { id } = await params;
  const interactive = await fetchAdminInteractive(id);
  return (
    <div className="w-full">
      <InteractiveEditor interactive={interactive} />
    </div>
  );
}
