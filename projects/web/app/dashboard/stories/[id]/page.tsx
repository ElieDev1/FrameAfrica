import type { Metadata } from 'next';
import Link from 'next/link';
import { CorrectionForm } from '@/components/cms/CorrectionForm';
import { DraftForm } from '@/components/cms/DraftForm';
import { LiveComposer } from '@/components/cms/LiveComposer';
import { StatusBadge } from '@/components/cms/StatusBadge';
import {
  categoryOptions,
  getDraft,
  isEditable,
  isEditor,
  requireStaff,
  topicOptions,
} from '@/lib/cms';
import {
  archiveAction,
  featureAction,
  submitDraftAction,
  updateDraftAction,
} from '@/lib/cms-actions';

export const metadata: Metadata = { title: 'Edit draft — Frame Africa' };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditDraftPage({ params }: PageProps) {
  const user = await requireStaff();
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

      {draft.reviewNote && (
        <div className="mt-4 rounded-xl border-l-4 border-accent-red bg-surface px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-red">
            Returned by an editor
          </p>
          <p className="mt-1 font-body text-sm text-text">{draft.reviewNote}</p>
        </div>
      )}

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
          {draft.status === 'published' && (
            <div className="mt-5 border-t border-border pt-4">
              <LiveComposer articleId={draft.id} slug={draft.slug} isLive={draft.isLive} />
            </div>
          )}
          {draft.status === 'published' && isEditor(user) && (
            <div className="mt-5 border-t border-border pt-4">
              <form action={featureAction.bind(null, draft.id, !draft.isFeatured)}>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Homepage
                </p>
                <p className="mt-1 font-body text-sm text-muted">
                  {draft.isFeatured
                    ? 'This story is pinned as a homepage lead.'
                    : 'Not featured on the homepage.'}
                </p>
                <button
                  type="submit"
                  className="mt-2 rounded-lg border border-primary px-4 py-2 font-mono text-xs uppercase tracking-wide text-primary hover:bg-primary hover:text-black"
                >
                  {draft.isFeatured ? 'Unpin from homepage' : 'Feature on homepage'}
                </button>
              </form>
              <div className="mt-5 border-t border-border pt-4">
                <CorrectionForm articleId={draft.id} />
              </div>
              <form
                action={archiveAction.bind(null, draft.id)}
                className="mt-5 border-t border-border pt-4"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Archive
                </p>
                <p className="mt-1 font-body text-sm text-muted">
                  Removes the story from the public site (keeps it in the newsroom).
                </p>
                <button
                  type="submit"
                  className="mt-2 rounded-lg border border-accent-red/50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-accent-red hover:bg-accent-red/10"
                >
                  Archive article
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
