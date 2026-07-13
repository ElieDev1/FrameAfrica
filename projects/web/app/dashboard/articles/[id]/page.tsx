import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleAdminActions } from '@/components/dashboard/ArticleAdminActions';
import { DraftForm } from '@/components/cms/DraftForm';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { categoryOptions, getAnyArticle, requireAdmin, topicOptions } from '@/lib/cms';
import { updateAnyArticleAction } from '@/lib/cms-actions';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Edit article — Frame Africa' };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditArticlePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const [article, categories, topics, locale] = await Promise.all([
    getAnyArticle(id),
    categoryOptions(),
    topicOptions(),
    getLocale(),
  ]);

  const updateAction = updateAnyArticleAction.bind(null, id);

  return (
    <div className="w-full">
      <Link href="/dashboard/articles" className="font-mono text-xs text-primary hover:underline">
        {t(locale, 'dpage.backAllArticles')}
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-black tracking-tight text-text">
          {t(locale, 'dpage.editArticle')}
        </h1>
        <StatusBadge status={article.status} />
      </div>
      <p className="mt-2 font-body text-sm text-muted">
        Admin edit — changes apply immediately, even for a published article. Each save records a
        revision attributed to you.
      </p>

      {article.status === 'published' && (
        <Link
          href={`/article/${article.slug}`}
          className="mt-2 inline-block font-mono text-xs text-primary hover:underline"
        >
          View published article →
        </Link>
      )}

      <div className="mt-6">
        <DraftForm
          action={updateAction}
          categories={categories}
          topics={topics}
          mode="edit"
          initial={{
            title: article.title,
            categoryId: article.category.id,
            subtitle: article.subtitle ?? '',
            excerpt: article.excerpt ?? '',
            body: article.body,
            blocks: article.blocks,
            topicSlugs: article.topics.map((t) => t.slug),
            language: article.language,
            isPremium: article.isPremium,
            featuredImageUrl: article.featuredImageUrl ?? '',
            featuredImageAlt: article.featuredImageAlt ?? '',
            featuredImageCredit: article.featuredImageCredit ?? '',
          }}
        />
      </div>

      <div className="mt-8">
        <ArticleAdminActions id={article.id} status={article.status} />
      </div>
    </div>
  );
}
