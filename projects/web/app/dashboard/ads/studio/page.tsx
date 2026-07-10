import type { Metadata } from 'next';
import Link from 'next/link';
import { AdStudio } from '@/components/ads/AdStudio';
import { requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Ad Studio — Frame Africa' };

export default async function AdStudioPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text">Ad Studio</h1>
          <p className="mt-1 font-body text-sm text-muted">
            Design a creative at the exact IAB size, then publish it straight into a live slot.
          </p>
        </div>
        <Link
          href="/dashboard/ads"
          className="font-mono text-xs uppercase tracking-wide text-primary hover:underline"
        >
          ← House ads
        </Link>
      </div>

      <AdStudio />
    </div>
  );
}
