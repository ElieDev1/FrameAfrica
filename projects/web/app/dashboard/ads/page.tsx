import type { Metadata } from 'next';
import { AdManager } from '@/components/ads/AdManager';
import { fetchHouseAds, requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Ads — Frame Africa' };

export default async function AdsPage() {
  await requireAdmin();
  const ads = await fetchHouseAds();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">House ads</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Manage the creatives served into labelled ad slots. Impressions and clicks are counted.
      </p>
      <AdManager ads={ads} />
    </div>
  );
}
