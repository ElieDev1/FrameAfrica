import { PushKeysCard } from '@/components/dashboard/PushKeysCard';
import { SettingsAdmin } from '@/components/dashboard/SettingsAdmin';
import { requireAdmin } from '@/lib/cms';
import { fetchPushOverview } from '@/lib/push-actions';
import { fetchIntegrations } from '@/lib/settings';

export default async function SettingsPage() {
  await requireAdmin();
  const [integrations, push] = await Promise.all([fetchIntegrations(), fetchPushOverview()]);

  return (
    <div className="flex w-full flex-col gap-10">
      {/* Push needs a *generated* key pair, not a pasted one — so it gets its own card. */}
      <PushKeysCard configured={push.configured} subscribers={push.subscribers} />
      <SettingsAdmin integrations={integrations} />
    </div>
  );
}
