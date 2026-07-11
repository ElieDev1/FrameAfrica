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
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Tips inbox</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Confidential tips from the public — {tips.length} total, {open} new.
      </p>

      {tips.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">No tips yet</p>
          <p className="mt-1 font-body text-sm text-muted">Public tips will land here.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 lg:max-w-4xl">
          {tips.map((tip) => (
            <li key={tip.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                  {formatDate(tip.createdAt)}
                </span>
                <TipStatusControl id={tip.id} status={tip.status} />
              </div>
              <p className="mt-2 whitespace-pre-wrap font-body text-text">{tip.message}</p>
              {tip.contact && (
                <p className="mt-3 border-t border-border pt-2 font-mono text-[11px] text-muted">
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
