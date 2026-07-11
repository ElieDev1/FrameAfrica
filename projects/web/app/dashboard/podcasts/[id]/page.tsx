import type { Metadata } from 'next';
import { ShowEditor } from '@/components/dashboard/ShowEditor';
import { fetchAdminPodcast, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Edit show — Frame Africa' };

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  await requireEditor();
  const { id } = await params;
  const show = await fetchAdminPodcast(id);
  return (
    <div className="w-full">
      <ShowEditor show={show} />
    </div>
  );
}
