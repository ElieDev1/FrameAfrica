import type { Metadata } from 'next';
import Link from 'next/link';
import { listCopyDesk, requireCopyDesk } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Copy desk — Frame Africa' };

export default async function CopyDeskPage() {
  await requireCopyDesk();
  const items = await listCopyDesk();

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Copy desk</h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Submitted stories waiting for a copy-edit — {items.length} in the queue. Polish the copy,
        then pass it to the editors or send it back to the writer.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">The copy desk is clear</p>
          <p className="mt-1 font-body text-sm text-muted">Nothing is waiting for a copy-edit.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/copydesk/${a.id}`}
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-heading font-bold text-text">{a.title}</div>
                  <div className="font-mono text-[11px] text-muted">
                    {a.category.name} · {a.author.displayName} · updated {formatDate(a.updatedAt)}
                  </div>
                </div>
                <span className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary transition group-hover:border-primary">
                  Copy-edit →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
