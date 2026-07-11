import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { listReviewQueue, requireEditor } from '@/lib/cms';
import { publishAction, rejectAction, scheduleAction } from '@/lib/cms-actions';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Review queue — Frame Africa' };

export default async function ReviewPage() {
  await requireEditor();
  const [queue, locale] = await Promise.all([listReviewQueue(), getLocale()]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dash.reviewQueue')}
          </h1>
          <p className="mt-1 font-body text-sm text-muted">
            {queue.length} {t(locale, 'dpage.stories')} {t(locale, 'dpage.awaitingDecision')}
          </p>
        </div>
        <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
          {t(locale, 'dpage.backNewsroom')}
        </Link>
      </div>

      {queue.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">{t(locale, 'dpage.allClear')}</p>
          <p className="mt-1 font-body text-sm text-muted">
            {t(locale, 'dpage.nothingAwaitingReview')}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4 lg:max-w-4xl">
          {queue.map((item) => (
            <li key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/stories/${item.id}`}
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
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <form action={publishAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-black hover:opacity-90"
                  >
                    Publish now
                  </button>
                </form>
                <form
                  action={scheduleAction.bind(null, item.id)}
                  className="flex items-center gap-2"
                >
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    required
                    className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs text-text outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-primary px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-primary hover:bg-primary hover:text-black"
                  >
                    Schedule
                  </button>
                </form>
                <form
                  action={rejectAction.bind(null, item.id)}
                  className="flex flex-1 flex-wrap items-start gap-2"
                >
                  <textarea
                    name="note"
                    rows={1}
                    maxLength={1000}
                    placeholder="Return note (optional) — what should the author fix?"
                    className="min-w-[14rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-accent-red px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-accent-red hover:bg-accent-red hover:text-white"
                  >
                    Return
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
