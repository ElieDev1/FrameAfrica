'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/cms/StatusBadge';
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  PenIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { DraftListItem } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/lib/i18n';

const PAGE_SIZE = 12;

/** Broad status buckets for the filter tabs. */
const TABS: { key: string; labelKey: MessageKey; match: (s: string) => boolean }[] = [
  { key: 'all', labelKey: 'dinq.all', match: () => true },
  {
    key: 'draft',
    labelKey: 'dst.drafts',
    match: (s) => ['draft', 'in_progress', 'rejected'].includes(s),
  },
  {
    key: 'review',
    labelKey: 'dst.inReview',
    match: (s) => ['copy_edit', 'ready', 'embargoed'].includes(s),
  },
  { key: 'published', labelKey: 'dst.published', match: (s) => s === 'published' },
  { key: 'archived', labelKey: 'dst.archived', match: (s) => s === 'archived' },
];

const EDITABLE = new Set(['draft', 'in_progress', 'rejected']);

/** Per-row action buttons, shared by the desktop table and the mobile cards. */
function RowActions({
  d,
  basePath,
  deleteAction,
}: {
  d: DraftListItem;
  basePath: string;
  deleteAction?: (id: string) => Promise<void>;
}) {
  const t = useT();
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary';
  return (
    <div className="flex items-center gap-1">
      {EDITABLE.has(d.status) && (
        <Link
          href={`${basePath}/${d.id}`}
          aria-label={t('dst.editStory')}
          className={`${btn} text-text`}
        >
          <PenIcon size={13} /> {t('d.common.edit')}
        </Link>
      )}
      {d.status === 'published' && (
        <Link
          href={`/article/${d.slug}`}
          target="_blank"
          aria-label={t('dst.viewPublished')}
          className={`${btn} text-text`}
        >
          <ArrowUpRightIcon size={13} /> {t('dst.view')}
        </Link>
      )}
      {!EDITABLE.has(d.status) && d.status !== 'published' && (
        <Link href={`${basePath}/${d.id}`} className={`${btn} text-muted`}>
          {t('dst.open')}
        </Link>
      )}
      {deleteAction && (
        <form
          action={deleteAction.bind(null, d.id)}
          onSubmit={(e) => {
            if (!confirm(`Delete “${d.title}”? This cannot be undone.`)) e.preventDefault();
          }}
        >
          <button
            type="submit"
            aria-label={t('dst.deleteArticle')}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-muted transition hover:border-accent-red hover:text-accent-red"
          >
            <TrashIcon size={13} />
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * Story management table with status tabs, search and per-row actions. Used for
 * both "My stories" (basePath /dashboard/stories) and the admin "All articles"
 * list (/dashboard/articles) — rows open the matching editor.
 */
export function StoriesTable({
  drafts,
  basePath = '/dashboard/stories',
  deleteAction,
}: {
  drafts: DraftListItem[];
  basePath?: string;
  /** When provided, each row gets a Delete button bound to this action (admin). */
  deleteAction?: (id: string) => Promise<void>;
}) {
  const tr = useT();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.key] = drafts.filter((d) => t.match(d.status)).length;
    return c;
  }, [drafts]);

  const rows = useMemo(() => {
    const active = TABS.find((t) => t.key === tab) ?? TABS[0];
    const q = query.trim().toLowerCase();
    return drafts.filter(
      (d) =>
        active.match(d.status) &&
        (q === '' ||
          d.title.toLowerCase().includes(q) ||
          d.category.name.toLowerCase().includes(q)),
    );
  }, [drafts, tab, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstRow = rows.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(current * PAGE_SIZE, rows.length);

  function selectTab(key: string) {
    setTab(key);
    setPage(1);
  }
  function search(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="mt-6">
      {/* Toolbar: tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label={tr('dst.filterByStatus')}>
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              role="tab"
              aria-selected={tab === tabItem.key}
              onClick={() => selectTab(tabItem.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === tabItem.key
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              }`}
            >
              {tr(tabItem.labelKey)}
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  tab === tabItem.key ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-faint'
                }`}
              >
                {counts[tabItem.key]}
              </span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <SearchIcon size={15} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={tr('dst.searchStories')}
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      {/* Mobile: cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {pageRows.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-surface p-4">
            <Link
              href={`${basePath}/${d.id}`}
              className="flex items-start gap-2 font-heading font-bold leading-snug text-text hover:text-primary"
            >
              <span className="min-w-0">{d.title}</span>
              {d.isPremium && (
                <span className="mt-0.5 shrink-0 rounded bg-accent-yellow/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-accent-yellow">
                  Premium
                </span>
              )}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <StatusBadge status={d.status} />
              <span>{d.category.name}</span>
              <span className="font-mono text-faint">· {formatDate(d.updatedAt)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              <RowActions d={d} basePath={basePath} deleteAction={deleteAction} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center font-body text-sm text-muted">
            {query ? tr('dst.noMatch') : tr('dst.nothingYet')}
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <th className="px-4 py-3 font-medium">{tr('dst.story')}</th>
                <th className="px-4 py-3 font-medium">{tr('dst.section')}</th>
                <th className="px-4 py-3 font-medium">{tr('dst.status')}</th>
                <th className="px-4 py-3 font-medium">{tr('dst.updated')}</th>
                <th className="px-4 py-3 text-right font-medium">{tr('dst.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((d) => (
                <tr key={d.id} className="group transition-colors hover:bg-surface-2/50">
                  <td className="max-w-[26rem] px-4 py-3">
                    <Link
                      href={`${basePath}/${d.id}`}
                      className="flex items-center gap-2 font-heading font-bold text-text hover:text-primary"
                    >
                      <span className="truncate">{d.title}</span>
                      {d.isPremium && (
                        <span className="shrink-0 rounded bg-accent-yellow/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-accent-yellow">
                          Premium
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{d.category.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                    {formatDate(d.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <RowActions d={d} basePath={basePath} deleteAction={deleteAction} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-4 py-12 text-center font-body text-sm text-muted">
            {query ? tr('dst.noMatch') : tr('dst.nothingYet')}
          </p>
        )}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-mono text-xs text-muted">
            {firstRow}–{lastRow} {tr('dpg.of')} {rows.length}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRightIcon size={13} className="rotate-180" /> {tr('dpg.prev')}
              </button>
              <span className="px-2 font-mono text-xs text-muted">
                {tr('dpg.page')} {current} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                {tr('dpg.next')} <ChevronRightIcon size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
