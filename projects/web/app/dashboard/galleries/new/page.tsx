import type { Metadata } from 'next';
import { GalleryEditor } from '@/components/dashboard/GalleryEditor';
import { requirePhotographer } from '@/lib/cms';

export const metadata: Metadata = { title: 'New gallery — Frame Africa' };

export default async function NewGalleryPage() {
  await requirePhotographer();
  return (
    <div className="w-full">
      <GalleryEditor />
    </div>
  );
}
