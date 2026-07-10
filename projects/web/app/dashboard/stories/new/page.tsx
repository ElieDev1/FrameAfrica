import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftForm } from '@/components/cms/DraftForm';
import { categoryOptions, requireStaff, topicOptions } from '@/lib/cms';
import { createDraftAction } from '@/lib/cms-actions';

export const metadata: Metadata = { title: 'New draft — Frame Africa' };

export default async function NewDraftPage() {
  await requireStaff();
  const [categories, topics] = await Promise.all([categoryOptions(), topicOptions()]);

  return (
    <div className="w-full">
      <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
        ← Newsroom
      </Link>
      <h1 className="mt-3 font-heading text-3xl font-black tracking-tight text-text">New story</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Write on the left; set the section, image and topics on the right, then publish.
      </p>
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
