import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftForm } from '@/components/cms/DraftForm';
import { categoryOptions, getCopyDeskItem, requireCopyDesk, topicOptions } from '@/lib/cms';
import { copyEditSaveAction, passCopyEditAction, returnCopyEditAction } from '@/lib/cms-actions';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Copy-edit — Frame Africa' };

type PageProps = { params: Promise<{ id: string }> };

export default async function CopyEditPage({ params }: PageProps) {
  await requireCopyDesk();
  const { id } = await params;
  const [article, categories, topics, locale] = await Promise.all([
    getCopyDeskItem(id),
    categoryOptions(),
    topicOptions(),
    getLocale(),
  ]);

  const saveAction = copyEditSaveAction.bind(null, id);
  const passAction = passCopyEditAction.bind(null, id);
  const returnAction = returnCopyEditAction.bind(null, id);

  return (
    <div className="w-full">
      <Link href="/dashboard/copydesk" className="font-mono text-xs text-primary hover:underline">
        {t(locale, 'dpage.backCopyDesk')}
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-black tracking-tight text-text">
        {t(locale, 'dpage.copyEdit')}
      </h1>
      <p className="mt-1 font-body text-sm text-muted">{t(locale, 'dpage.copyEditSubtitle')}</p>

      <div className="mt-6">
        <DraftForm
          action={saveAction}
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

      <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
        <form action={passAction}>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black hover:opacity-90"
          >
            Pass to editors →
          </button>
          <p className="mt-2 font-body text-xs text-muted">
            Sends the story to the editors&apos; review queue.
          </p>
        </form>

        <form action={returnAction} className="flex flex-col gap-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Return to writer
          </label>
          <textarea
            name="note"
            rows={2}
            placeholder="What needs fixing?"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="self-start rounded-lg border border-accent-red/40 px-4 py-2 font-mono text-xs uppercase tracking-wide text-accent-red hover:bg-accent-red/10"
          >
            Return to writer
          </button>
        </form>
      </div>
    </div>
  );
}
