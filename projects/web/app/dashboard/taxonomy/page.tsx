import type { Metadata } from 'next';
import { TaxonomyAdmin } from '@/components/dashboard/TaxonomyAdmin';
import { requireAdmin } from '@/lib/cms';
import { fetchAdminCategories, fetchAdminTopics } from '@/lib/taxonomy';

export const metadata: Metadata = { title: 'Taxonomy — Frame Africa' };

export default async function TaxonomyPage() {
  await requireAdmin();
  const [categories, topics] = await Promise.all([fetchAdminCategories(), fetchAdminTopics()]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Taxonomy</h1>
      <p className="mt-2 font-body text-muted">
        Manage the sections, sub-sections, and topics that organise the whole site. A section with
        sub-sections or articles can&apos;t be deleted until it&apos;s emptied.
      </p>
      <div className="mt-8">
        <TaxonomyAdmin categories={categories} topics={topics} />
      </div>
    </div>
  );
}
