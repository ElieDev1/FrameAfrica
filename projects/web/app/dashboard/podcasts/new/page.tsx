import type { Metadata } from 'next';
import { ShowEditor } from '@/components/dashboard/ShowEditor';
import { requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'New show — Frame Africa' };

export default async function NewShowPage() {
  await requireEditor();
  return (
    <div className="w-full">
      <ShowEditor />
    </div>
  );
}
