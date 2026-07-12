import type { Metadata } from 'next';
import Link from 'next/link';
import { AdStudio } from '@/components/ads/AdStudio';
import { listMedia, requireAdmin } from '@/lib/cms';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Ad Studio — Frame Africa' };

export default async function AdStudioPage() {
  await requireAdmin();
  // The Studio only needs images to pick from — one generous page is plenty.
  const [media, locale] = await Promise.all([
    listMedia(undefined, 'image', 1, 100)
      .then((r) => r.items)
      .catch(() => []),
    getLocale(),
  ]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dpage.adStudio')}
          </h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted">
            {t(locale, 'dpage.adStudioSubtitle')}
          </p>
        </div>
        <Link
          href="/dashboard/ads"
          className="font-mono text-xs uppercase tracking-wide text-primary hover:underline"
        >
          {t(locale, 'dpage.backHouseAds')}
        </Link>
      </div>

      <AdStudio media={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt }))} />
    </div>
  );
}
