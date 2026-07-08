import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { listAllArticles, requireAdmin } from '@/lib/cms';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'All articles — Frame Africa' };

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Ready', value: 'ready' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Draft', value: 'draft' },
  { label: 'Rejected', value: 'rejected' },
];

type PageProps = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function AllArticlesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status = '', q = '' } = await searchParams;
  const articles = await listAllArticles({ status: status || undefined, q: q || undefined });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">All articles</h1>
      <p className="mt-2 font-body text-muted">
        Every article across the newsroom. As an admin you can open and edit any of them, whatever
        the author or status.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.value;
          const href = f.value ? `/dashboard/articles?status=${f.value}` : '/dashboard/articles';
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/articles/${a.id}`}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface"
          >
            <div className="min-w-0">
              <div className="truncate font-body text-sm text-text">{a.title}</div>
              <div className="font-mono text-[10px] text-muted">
                {a.category.name} · updated {formatDate(a.updatedAt)}
              </div>
            </div>
            <StatusBadge status={a.status} />
          </Link>
        ))}
        {articles.length === 0 && (
          <p className="px-4 py-6 text-center font-body text-sm text-muted">No articles found.</p>
        )}
      </div>
    </div>
  );
}
