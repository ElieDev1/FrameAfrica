import type { Metadata } from 'next';
import { GalleryEditor } from '@/components/dashboard/GalleryEditor';
import { fetchAdminGallery, requirePhotographer } from '@/lib/cms';

export const metadata: Metadata = { title: 'Edit gallery — Frame Africa' };

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePhotographer();
  const { id } = await params;
  const gallery = await fetchAdminGallery(id);

  return (
    <div className="w-full">
      <GalleryEditor gallery={gallery} />
    </div>
  );
}
