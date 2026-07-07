import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftForm } from '@/components/cms/DraftForm';
import { categoryOptions, requireStaff } from '@/lib/cms';
import { createDraftAction } from '@/lib/cms-actions';

export const metadata: Metadata = { title: 'New draft — Frame Africa' };

export default async function NewDraftPage() {
  await requireStaff();
  const categories = await categoryOptions();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
        ← Newsroom
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-black tracking-tight text-text">New draft</h1>
      <div className="mt-6">
        <DraftForm action={createDraftAction} categories={categories} mode="create" />
      </div>
    </div>
  );
}
