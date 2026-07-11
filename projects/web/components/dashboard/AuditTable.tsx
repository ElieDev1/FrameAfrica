'use client';

import { useMemo, useState } from 'react';
import { ChevronRightIcon, SearchIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { AuditEntry } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/lib/i18n';

const PAGE_SIZE = 15;

const ACTION_LABELS: Record<string, MessageKey> = {
  'account.erased': 'daud.accountErased',
  'user.roles_changed': 'daud.rolesChanged',
  'user.status_changed': 'daud.statusChanged',
};

/** Humanise an action key like `user.roles_changed` → `Roles changed`. */
function actionLabel(action: string, t: (k: MessageKey) => string): string {
  if (ACTION_LABELS[action]) return t(ACTION_LABELS[action]);
  const tail = action.includes('.') ? action.slice(action.indexOf('.') + 1) : action;
  const s = tail.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Tone the action badge by its category prefix. */
function actionTone(action: string): string {
  const cat = action.split('.')[0];
  if (cat === 'account') return 'border-accent-red/40 text-accent-red';
  if (cat === 'user') return 'border-primary/40 text-primary';
  if (cat === 'article' || cat === 'content') return 'border-accent-green/40 text-accent-green';
  return 'border-border text-muted';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'S';
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);

  const actions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))).sort(),
    [entries],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (action === 'all' || e.action === action) &&
        (q === '' ||
          (e.actor?.displayName ?? 'system').toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          (e.targetType ?? '').toLowerCase().includes(q)),
    );
  }, [entries, query, action]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstRow = rows.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(current * PAGE_SIZE, rows.length);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
        >
          <option value="all">{t('daud.allActions')}</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a, t)}
            </option>
          ))}
        </select>
        <label className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <SearchIcon size={15} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t('daud.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <th className="px-4 py-3 font-medium">{t('daud.when')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.actor')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.action')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.target')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-surface-2/50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-heading text-[10px] font-black ${
                          e.actor
                            ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                            : 'bg-surface-2 text-faint ring-1 ring-border'
                        }`}
                      >
                        {e.actor ? initials(e.actor.displayName) : 'SYS'}
                      </span>
                      <span className="text-sm text-text">
                        {e.actor?.displayName ?? t('daud.system')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${actionTone(
                        e.action,
                      )}`}
                    >
                      {actionLabel(e.action, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-faint">
                    {e.targetType ? `${e.targetType}:${e.targetId?.slice(0, 8) ?? '—'}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-4 py-12 text-center font-body text-sm text-muted">
            {t('daud.noEntries')}
          </p>
        )}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-mono text-xs text-muted">
            {firstRow}–{lastRow} {t('dpg.of')} {rows.length}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRightIcon size={13} className="rotate-180" /> {t('dpg.prev')}
              </button>
              <span className="px-2 font-mono text-xs text-muted">
                {t('dpg.page')} {current} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                {t('dpg.next')} <ChevronRightIcon size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
