import type { Metadata } from 'next';
import { GrantSubscription } from '@/components/dashboard/GrantSubscription';
import { SubscribersTable } from '@/components/dashboard/SubscribersTable';
import { fetchGrantablePlans, fetchSubscribers } from '@/lib/billing-admin-actions';
import { requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Billing — Frame Africa' };

export default async function DashboardBillingPage() {
  await requireAdmin();
  const [plans, subscribers] = await Promise.all([fetchGrantablePlans(), fetchSubscribers()]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Billing</h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">
          Every subscriber and where they stand, plus the tools that aren’t self-serve: comp a
          subscription without a card, or end one immediately.
        </p>
      </div>

      <SubscribersTable subscriptions={subscribers} />
      <GrantSubscription plans={plans} />
    </div>
  );
}
