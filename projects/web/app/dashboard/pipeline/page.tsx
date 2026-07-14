import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { type DraftListItem, listAllArticles, requireEditor } from '@/lib/cms';
import { workflowTabs } from '@/lib/dash-tabs';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Pipeline — Frame Africa' };

const COLUMNS: { status: string; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'copy_edit', label: 'Copy desk' },
  { status: 'ready', label: 'Review' },
  { status: 'embargoed', label: 'Scheduled' },
  { status: 'published', label: 'Published' },
  { status: 'rejected', label: 'Returned' },
];

function Card({ article }: { article: DraftListItem }) {
  const inner = (
    <>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
        {article.category.name}
      </span>
      <p className="mt-1 line-clamp-3 font-heading text-sm font-bold leading-snug text-text">
        {article.title}
      </p>
      <span className="mt-2 block font-mono text-[10px] text-faint">
        {formatDate(article.updatedAt)}
      </span>
    </>
  );
  const cls =
    'block rounded-lg border border-border bg-surface p-3 transition hover:border-primary';
  return article.status === 'published' ? (
    <Link href={`/article/${article.slug}`} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default async function PipelinePage() {
  const user = await requireEditor();
  const [columns, locale] = await Promise.all([
    Promise.all(COLUMNS.map((c) => listAllArticles({ status: c.status }))),
    getLocale(),
  ]);

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.workflow')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.pipelineSubtitle')}
      </p>

      <DashTabs tabs={workflowTabs(user.roles)} />

      <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {COLUMNS.map((col, i) => (
          <section
            key={col.status}
            className="flex max-h-[calc(100vh-13rem)] w-72 shrink-0 flex-col rounded-xl border border-border bg-surface-2/40"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <StatusBadge status={col.status} />
              <span className="font-mono text-xs text-muted">{columns[i].length}</span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-3">
              {columns[i].length === 0 ? (
                <p className="px-1 py-2 font-body text-xs text-faint">
                  {t(locale, 'dpage.nothingHere')}
                </p>
              ) : (
                columns[i].map((article) => <Card key={article.id} article={article} />)
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
