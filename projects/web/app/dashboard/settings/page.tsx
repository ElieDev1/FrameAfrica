import { SettingsAdmin } from '@/components/dashboard/SettingsAdmin';
import { requireAdmin } from '@/lib/cms';
import { fetchIntegrations } from '@/lib/settings';

export default async function SettingsPage() {
  await requireAdmin();
  const integrations = await fetchIntegrations();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Settings</h1>
      <p className="mt-2 font-body text-muted">
        Integration keys and site configuration. Keys are admin-only and stored server-side.
      </p>
      <div className="mt-8">
        <SettingsAdmin integrations={integrations} />
      </div>
    </div>
  );
}
