import type { Metadata } from 'next';
import { TipStatusControl } from '@/components/cms/TipStatusControl';
import { fetchTips, requireModerator } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Tips — Frame Africa' };

export default async function TipsInboxPage() {
  await requireModerator();
  const tips = await fetchTips();
  const open = tips.filter((t) => t.status === 'new').length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Tips inbox</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Confidential tips from the public. {open} new.
      </p>

      {tips.length === 0 ? (
        <p className="mt-10 font-body text-muted">No tips yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {tips.map((tip) => (
            <li key={tip.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  {formatDate(tip.createdAt)}
                </span>
                <TipStatusControl id={tip.id} status={tip.status} />
              </div>
              <p className="mt-2 whitespace-pre-wrap font-body text-text">{tip.message}</p>
              {tip.contact && (
                <p className="mt-2 font-mono text-[11px] text-muted">
                  Contact: <span className="text-text">{tip.contact}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
