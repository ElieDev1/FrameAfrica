import { requireAdmin } from '@/lib/cms';

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Settings</h1>
      <p className="mt-2 font-body text-muted">Site configuration and feature flags.</p>
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-heading text-lg font-bold text-text">Coming next</p>
        <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted">
          System settings, feature flags, and audit-log access land with the admin slice.
        </p>
      </div>
    </div>
  );
}
