import type { Metadata } from 'next';
import { GrantSubscription } from '@/components/dashboard/GrantSubscription';
import { fetchGrantablePlans } from '@/lib/billing-admin-actions';
import { requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Billing — Frame Africa' };

export default async function DashboardBillingPage() {
  await requireAdmin();
  const plans = await fetchGrantablePlans();

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Billing</h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">
          Readers subscribe from the pricing page. Use this to comp a subscription — a corporate
          deal, cash paid offline, or a giveaway — without a card.
        </p>
      </div>

      <GrantSubscription plans={plans} />
    </div>
  );
}
