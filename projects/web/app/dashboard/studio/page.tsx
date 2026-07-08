import type { Metadata } from 'next';
import { StudioCanvas, type StudioArticle } from '@/components/studio/StudioCanvas';
import { fetchArticles } from '@/lib/api';
import { requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Studio — Frame Africa' };

export default async function StudioPage() {
  await requireStaff();

  // Recent published stories, offered for one-click "prefill".
  const { articles } = await fetchArticles({ limit: 24 });
  const prefill: StudioArticle[] = articles.map((a) => ({
    title: a.title,
    section: a.category.name,
    author: a.author.displayName,
    imageUrl: a.featuredImage?.url ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Studio</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Make branded social cards and flyers — start from a story or a template, customise
        everything, and download a PNG. No external software needed.
      </p>

      <div className="mt-6">
        <StudioCanvas articles={prefill} />
      </div>
    </div>
  );
}
