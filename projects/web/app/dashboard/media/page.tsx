import type { Metadata } from 'next';
import { MediaGrid } from '@/components/cms/MediaGrid';
import { MediaUpload } from '@/components/cms/MediaUpload';
import { isEditor, listMedia, requireStaff } from '@/lib/cms';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Media library — Frame Africa' };

export default async function MediaLibraryPage() {
  const user = await requireStaff();
  const [assets, locale] = await Promise.all([listMedia(), getLocale()]);

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.mediaLibrary')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.mediaSubtitle')}
      </p>

      <div className="mt-6">
        <MediaUpload />
      </div>

      <MediaGrid assets={assets} canDelete={isEditor(user)} />
    </div>
  );
}
