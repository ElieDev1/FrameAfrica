import type { Metadata } from 'next';
import Image from 'next/image';
import { MediaUpload } from '@/components/cms/MediaUpload';
import { listMedia, requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Media library — Frame Africa' };

export default async function MediaLibraryPage() {
  await requireStaff();
  const assets = await listMedia();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Media library</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Upload images once, then reuse them across stories. JPEG, PNG, WebP, GIF, or AVIF, up to 8
        MB.
      </p>

      <div className="mt-6">
        <MediaUpload />
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted">
        {assets.length} {assets.length === 1 ? 'image' : 'images'}
      </h2>

      {assets.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center font-body text-sm text-muted">
          Nothing here yet — upload your first image above.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="relative aspect-[4/3] w-full bg-surface-2">
                <Image
                  src={asset.url}
                  alt={asset.alt ?? ''}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="truncate font-body text-xs text-text" title={asset.alt ?? ''}>
                  {asset.alt || <span className="text-faint">No alt text</span>}
                </p>
                <input
                  readOnly
                  value={asset.url}
                  className="mt-1 w-full truncate rounded border border-border bg-surface-2 px-1.5 py-1 font-mono text-[10px] text-muted"
                  aria-label="Image URL"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
