import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftForm } from '@/components/cms/DraftForm';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { categoryOptions, getDraft, isEditable, requireStaff, topicOptions } from '@/lib/cms';
import { submitDraftAction, updateDraftAction } from '@/lib/cms-actions';

export const metadata: Metadata = { title: 'Edit draft — Frame Africa' };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditDraftPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;
  const [draft, categories, topics] = await Promise.all([
    getDraft(id),
    categoryOptions(),
    topicOptions(),
  ]);
  const editable = isEditable(draft.status);

  const updateAction = updateDraftAction.bind(null, id);
  const submitAction = submitDraftAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
        ← Newsroom
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-black tracking-tight text-text">Edit draft</h1>
        <StatusBadge status={draft.status} />
      </div>

      {editable ? (
        <>
          <div className="mt-6">
            <DraftForm
              action={updateAction}
              categories={categories}
              topics={topics}
              mode="edit"
              initial={{
                title: draft.title,
                categoryId: draft.category.id,
                subtitle: draft.subtitle ?? '',
                excerpt: draft.excerpt ?? '',
                body: draft.body,
                blocks: draft.blocks,
                topicSlugs: draft.topics.map((t) => t.slug),
                language: draft.language,
                isPremium: draft.isPremium,
                featuredImageUrl: draft.featuredImageUrl ?? '',
                featuredImageAlt: draft.featuredImageAlt ?? '',
                featuredImageCredit: draft.featuredImageCredit ?? '',
              }}
            />
          </div>

          <form action={submitAction} className="mt-8 border-t border-border pt-6">
            <button
              type="submit"
              className="rounded-lg border border-primary px-4 py-2 font-mono text-xs uppercase tracking-wide text-primary hover:bg-primary hover:text-black"
            >
              Submit for review
            </button>
            <p className="mt-2 font-body text-xs text-muted">
              Sends this draft to editors. You won&apos;t be able to edit it here afterwards.
            </p>
          </form>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-border p-6">
          <p className="font-body text-muted">
            This article is <strong className="text-text">{draft.status.replace('_', ' ')}</strong>{' '}
            and can&apos;t be edited here.
          </p>
          {draft.status === 'published' && (
            <Link
              href={`/article/${draft.slug}`}
              className="mt-3 inline-block font-mono text-xs text-primary hover:underline"
            >
              View published article →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
