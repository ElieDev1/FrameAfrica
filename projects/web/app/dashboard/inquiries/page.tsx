import type { Metadata } from 'next';
import { InquiriesAdmin } from '@/components/dashboard/InquiriesAdmin';
import { fetchInquiries, requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Inquiries — Frame Africa' };

export default async function InquiriesPage() {
  await requireAdmin();
  const inquiries = await fetchInquiries();

  return (
    <div className="w-full">
      <InquiriesAdmin inquiries={inquiries} />
    </div>
  );
}
