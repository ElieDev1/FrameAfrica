import type { Metadata } from 'next';
import { StudioCanvas, type StudioArticle } from '@/components/studio/StudioCanvas';
import { fetchArticles } from '@/lib/api';
import { requireStaff } from '@/lib/cms';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Flyer Studio — Frame Africa' };

export default async function StudioPage() {
  await requireStaff();
  const locale = await getLocale();

  // Recent published stories, offered for one-click "prefill".
  const { articles } = await fetchArticles({ limit: 24 });
  const prefill: StudioArticle[] = articles.map((a) => ({
    title: a.title,
    section: a.category.name,
    author: a.author.displayName,
    imageUrl: a.featuredImage?.url ?? null,
  }));

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dpage.flyerStudio')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.studioSubtitle')}
      </p>

      <div className="mt-6">
        <StudioCanvas articles={prefill} />
      </div>
    </div>
  );
}
