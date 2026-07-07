import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { listReviewQueue, requireEditor } from '@/lib/cms';
import { publishAction, rejectAction } from '@/lib/cms-actions';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Review queue — Frame Africa' };

export default async function ReviewPage() {
  await requireEditor();
  const queue = await listReviewQueue();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Review queue</h1>
        <Link href="/cms" className="font-mono text-xs text-primary hover:underline">
          ← Newsroom
        </Link>
      </div>

      {queue.length === 0 ? (
        <p className="mt-12 font-body text-muted">Nothing is awaiting review right now.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {queue.map((item) => (
            <li key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/cms/${item.id}`}
                    className="block truncate font-heading font-bold text-text hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {item.category.name} · {item.author.displayName} · submitted{' '}
                    {formatDate(item.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-4 flex gap-2">
                <form action={publishAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-black hover:opacity-90"
                  >
                    Publish
                  </button>
                </form>
                <form action={rejectAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-accent-red px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-accent-red hover:bg-accent-red hover:text-white"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
