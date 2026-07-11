import type { Metadata } from 'next';
import { TaxonomyAdmin } from '@/components/dashboard/TaxonomyAdmin';
import { requireAdmin } from '@/lib/cms';
import { fetchAdminCategories, fetchAdminTopics } from '@/lib/taxonomy';

export const metadata: Metadata = { title: 'Taxonomy — Frame Africa' };

export default async function TaxonomyPage() {
  await requireAdmin();
  const [categories, topics] = await Promise.all([fetchAdminCategories(), fetchAdminTopics()]);

  return (
    <div className="w-full">
      <TaxonomyAdmin categories={categories} topics={topics} />
    </div>
  );
}
