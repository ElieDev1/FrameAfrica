import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { type DraftListItem, listAllArticles, requireEditor } from '@/lib/cms';
import { formatDate } from '@/lib/format';

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
  await requireEditor();
  const columns = await Promise.all(COLUMNS.map((c) => listAllArticles({ status: c.status })));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">Pipeline</h1>
      <p className="mt-1 font-body text-sm text-muted">
        The whole newsroom at a glance — every story by stage.
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col, i) => (
          <section key={col.status} className="w-64 shrink-0">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="flex items-center gap-2">
                <StatusBadge status={col.status} />
                <span className="font-mono text-xs text-muted">{columns[i].length}</span>
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {columns[i].length === 0 ? (
                <p className="px-1 font-body text-xs text-faint">Nothing here.</p>
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
