import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { ReviewActions } from '@/components/dashboard/ReviewActions';
import { listReviewQueue, requireEditor } from '@/lib/cms';
import { workflowTabs } from '@/lib/dash-tabs';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Review queue — Frame Africa' };

export default async function ReviewPage() {
  const user = await requireEditor();
  const [queue, locale] = await Promise.all([listReviewQueue(), getLocale()]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {t(locale, 'dash.workflow')}
          </h1>
          <p className="mt-1 font-body text-sm text-muted">
            {queue.length} {t(locale, 'dpage.stories')} {t(locale, 'dpage.awaitingDecision')}
          </p>
        </div>
        <Link href="/dashboard/stories" className="font-mono text-xs text-primary hover:underline">
          {t(locale, 'dpage.backNewsroom')}
        </Link>
      </div>

      <DashTabs tabs={workflowTabs(user.roles)} />

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
              <div className="mt-4">
                <ReviewActions id={item.id} title={item.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
