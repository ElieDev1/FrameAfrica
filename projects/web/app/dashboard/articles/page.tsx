import type { Metadata } from 'next';
import Link from 'next/link';
import { StoriesTable } from '@/components/cms/StoriesTable';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { PlusIcon } from '@/components/icons';
import { adminDeleteArticleAction } from '@/lib/cms-actions';
import { listAllArticles, requireAdmin } from '@/lib/cms';
import { storiesTabs } from '@/lib/dash-tabs';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'All articles — Frame Africa' };

export default async function AllArticlesPage() {
  const user = await requireAdmin();
  const [articles, locale] = await Promise.all([listAllArticles(), getLocale()]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dash.stories')}
          </h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted">
            {t(locale, 'dpage.articlesSubtitle')}
          </p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={16} /> {t(locale, 'dpage.newArticle')}
        </Link>
      </div>

      <DashTabs tabs={storiesTabs(user.roles)} />

      {articles.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">
            {t(locale, 'dpage.noArticles')}
          </p>
        </div>
      ) : (
        <StoriesTable
          drafts={articles}
          basePath="/dashboard/articles"
          deleteAction={adminDeleteArticleAction}
        />
      )}
    </div>
  );
}
