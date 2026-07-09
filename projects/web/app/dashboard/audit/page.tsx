import type { Metadata } from 'next';
import { fetchAuditLog, requireAdmin } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit log — Frame Africa' };

const ACTION_LABELS: Record<string, string> = {
  'account.erased': 'Account erased',
  'user.roles_changed': 'Roles changed',
  'user.status_changed': 'Status changed',
};

export default async function AuditPage() {
  await requireAdmin();
  const entries = await fetchAuditLog();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Audit log</h1>
      <p className="mt-1 font-body text-sm text-muted">
        A record of privileged actions — who did what, and when.
      </p>

      {entries.length === 0 ? (
        <p className="mt-10 font-body text-muted">No privileged actions recorded yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <tr>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-muted">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-text">{e.actor?.displayName ?? 'System'}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-text">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-faint">
                    {e.targetType ? `${e.targetType}:${e.targetId?.slice(0, 8) ?? '—'}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
