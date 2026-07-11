import { SettingsAdmin } from '@/components/dashboard/SettingsAdmin';
import { requireAdmin } from '@/lib/cms';
import { fetchIntegrations } from '@/lib/settings';

export default async function SettingsPage() {
  await requireAdmin();
  const integrations = await fetchIntegrations();

  return (
    <div className="w-full">
      <SettingsAdmin integrations={integrations} />
    </div>
  );
}
