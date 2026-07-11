import type { Metadata } from 'next';
import { MediaGrid } from '@/components/cms/MediaGrid';
import { MediaUpload } from '@/components/cms/MediaUpload';
import { isEditor, listMedia, requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Media library — Frame Africa' };

export default async function MediaLibraryPage() {
  const user = await requireStaff();
  const assets = await listMedia();

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Media library</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Upload images once, then reuse them across stories. JPEG, PNG, WebP, GIF, or AVIF, up to 8
        MB.
      </p>

      <div className="mt-6">
        <MediaUpload />
      </div>

      <MediaGrid assets={assets} canDelete={isEditor(user)} />
    </div>
  );
}
