import type { Metadata } from 'next';
import Link from 'next/link';
import { StoriesTable } from '@/components/cms/StoriesTable';
import { PlusIcon } from '@/components/icons';
import { listMyDrafts, requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'My stories — Frame Africa' };

export default async function NewsroomPage() {
  await requireStaff();
  const drafts = await listMyDrafts();

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">My stories</h1>
          <p className="mt-1 font-body text-sm text-muted">
            {drafts.length} {drafts.length === 1 ? 'story' : 'stories'} in your newsroom.
          </p>
        </div>
        <Link
          href="/dashboard/stories/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={16} /> New story
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">No stories yet</p>
          <p className="mt-1 font-body text-sm text-muted">
            Start your first story to see it here.
          </p>
          <Link
            href="/dashboard/stories/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
          >
            <PlusIcon size={16} /> New story
          </Link>
        </div>
      ) : (
        <StoriesTable drafts={drafts} />
      )}
    </div>
  );
}
