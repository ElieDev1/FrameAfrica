import type { Metadata } from 'next';
import Link from 'next/link';
import { AdStudio } from '@/components/ads/AdStudio';
import { listMedia, requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Ad Studio — Frame Africa' };

export default async function AdStudioPage() {
  await requireAdmin();
  const media = await listMedia().catch(() => []);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">Ad Studio</h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted">
            Design a static creative at the exact IAB size, or drop in a video / GIF ad — then
            publish it straight into a live slot.
          </p>
        </div>
        <Link
          href="/dashboard/ads"
          className="font-mono text-xs uppercase tracking-wide text-primary hover:underline"
        >
          ← House ads
        </Link>
      </div>

      <AdStudio media={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt }))} />
    </div>
  );
}
