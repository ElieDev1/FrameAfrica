import type { Metadata } from 'next';
import Link from 'next/link';
import { listCopyDesk, requireCopyDesk } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Copy desk — Frame Africa' };

export default async function CopyDeskPage() {
  await requireCopyDesk();
  const items = await listCopyDesk();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Copy desk</h1>
      <p className="mt-2 font-body text-muted">
        Submitted stories waiting for a copy-edit. Polish the copy, then pass it to the editors or
        send it back to the writer.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/copydesk/${a.id}`}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface"
          >
            <div className="min-w-0">
              <div className="truncate font-body text-sm text-text">{a.title}</div>
              <div className="font-mono text-[10px] text-muted">
                {a.category.name} · {a.author.displayName} · updated {formatDate(a.updatedAt)}
              </div>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
              Copy-edit →
            </span>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="px-4 py-8 text-center font-body text-sm text-muted">
            The copy desk is clear.
          </p>
        )}
      </div>
    </div>
  );
}
