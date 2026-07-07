import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { listMyDrafts, requireStaff } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Newsroom — Frame Africa' };

export default async function NewsroomPage() {
  await requireStaff();
  const drafts = await listMyDrafts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Newsroom</h1>
        <Link
          href="/cms/new"
          className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black hover:opacity-90"
        >
          New draft
        </Link>
      </div>

      {drafts.length === 0 ? (
        <p className="mt-12 font-body text-muted">No drafts yet — start your first story.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border">
          {drafts.map((draft) => (
            <li key={draft.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/cms/${draft.id}`}
                  className="block truncate font-heading font-bold text-text hover:text-primary"
                >
                  {draft.title}
                </Link>
                <p className="font-mono text-xs text-muted">
                  {draft.category.name} · updated {formatDate(draft.updatedAt)}
                </p>
              </div>
              <StatusBadge status={draft.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
