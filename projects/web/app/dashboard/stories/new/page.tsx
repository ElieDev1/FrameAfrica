import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftForm } from '@/components/cms/DraftForm';
import { categoryOptions, requireStaff, topicOptions } from '@/lib/cms';
import { createDraftAction } from '@/lib/cms-actions';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'New draft — Frame Africa' };

export default async function NewDraftPage() {
  await requireStaff();
  const [categories, topics, locale] = await Promise.all([
    categoryOptions(),
    topicOptions(),
    getLocale(),
  ]);

  return (
    <div className="w-full">
      <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
        {t(locale, 'dpage.backNewsroom')}
      </Link>
      <h1 className="mt-3 font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.newStory')}
      </h1>
      <p className="mt-1 font-body text-sm text-muted">{t(locale, 'dpage.newStorySubtitle')}</p>
      <div className="mt-6">
        <DraftForm
          action={createDraftAction}
          categories={categories}
          topics={topics}
          mode="create"
        />
      </div>
    </div>
  );
}
