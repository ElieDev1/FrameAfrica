import type { Metadata } from 'next';
import Link from 'next/link';
import { AdManager } from '@/components/ads/AdManager';
import { SparklesIcon } from '@/components/icons';
import { fetchHouseAds, requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Ads — Frame Africa' };

export default async function AdsPage() {
  await requireAdmin();
  const ads = await fetchHouseAds();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text">House ads</h1>
          <p className="mt-1 font-body text-sm text-muted">
            Manage the creatives served into labelled ad slots. Impressions and clicks are counted.
          </p>
        </div>
        <Link
          href="/dashboard/ads/studio"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-heading text-xs font-bold text-black transition hover:opacity-90"
        >
          <SparklesIcon size={15} aria-hidden />
          Ad Studio
        </Link>
      </div>
      <AdManager ads={ads} />
    </div>
  );
}
