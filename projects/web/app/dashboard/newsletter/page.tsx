import type { Metadata } from 'next';
import { NewsletterAdmin } from '@/components/dashboard/NewsletterAdmin';
import { fetchNewsletterData, requireEditor } from '@/lib/cms';

export const metadata: Metadata = { title: 'Newsletter — Frame Africa' };

export default async function NewsletterPage() {
  await requireEditor();
  const { count, campaigns } = await fetchNewsletterData();

  return (
    <div className="w-full">
      <NewsletterAdmin count={count} campaigns={campaigns} />
    </div>
  );
}
