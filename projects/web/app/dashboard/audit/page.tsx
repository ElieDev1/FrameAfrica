import type { Metadata } from 'next';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { fetchAuditLog, requireAdmin } from '@/lib/cms';

export const metadata: Metadata = { title: 'Audit log — Frame Africa' };

export default async function AuditPage() {
  await requireAdmin();
  const entries = await fetchAuditLog();

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Audit log</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        A record of privileged actions — who did what, and when. {entries.length}{' '}
        {entries.length === 1 ? 'entry' : 'entries'}.
      </p>

      {entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">Nothing logged yet</p>
          <p className="mt-1 font-body text-sm text-muted">
            Privileged actions will appear here as they happen.
          </p>
        </div>
      ) : (
        <AuditTable entries={entries} />
      )}
    </div>
  );
}
