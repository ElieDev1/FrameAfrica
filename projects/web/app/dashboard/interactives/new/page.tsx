import type { Metadata } from 'next';
import { InteractiveEditor } from '@/components/dashboard/InteractiveEditor';
import { requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'New interactive — Frame Africa' };

export default async function NewInteractivePage() {
  await requireEditor();
  return (
    <div className="w-full">
      <InteractiveEditor />
    </div>
  );
}
