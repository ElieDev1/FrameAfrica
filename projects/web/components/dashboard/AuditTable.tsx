'use client';

import { Fragment, useMemo, useState } from 'react';
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
  'user.subscription_changed': 'daud.subChanged',
  'user.locked': 'daud.locked',
  'user.unlocked': 'daud.unlocked',
  'user.password_reset': 'daud.passwordReset',
};

/** Security-sensitive actions get their own category + red tone. */
const SECURITY = new Set(['user.locked', 'user.unlocked', 'user.password_reset', 'account.erased']);

type Category = 'security' | 'users' | 'content' | 'other';

function category(action: string): Category {
  if (SECURITY.has(action)) return 'security';
  const head = action.split('.')[0];
  if (head === 'user') return 'users';
  if (head === 'article' || head === 'content') return 'content';
  return 'other';
}

/** Humanise an action key like `user.roles_changed` → `Roles changed`. */
function actionLabel(action: string, t: (k: MessageKey) => string): string {
  if (ACTION_LABELS[action]) return t(ACTION_LABELS[action]);
  const tail = action.includes('.') ? action.slice(action.indexOf('.') + 1) : action;
  const s = tail.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TONE: Record<Category, string> = {
  security: 'border-accent-red/40 text-accent-red',
  users: 'border-primary/40 text-primary',
  content: 'border-accent-green/40 text-accent-green',
  other: 'border-border text-muted',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'S';
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div
        className={`font-heading text-2xl font-black tabular-nums ${accent && value > 0 ? 'text-accent-red' : 'text-text'}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
    </div>
  );
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [cat, setCat] = useState<'all' | Category>('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  // Captured once at mount so the "last 24h" window is stable across renders.
  const [now] = useState(() => Date.now());

  const actions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))).sort(),
    [entries],
  );

  // Summary stats over the whole (unfiltered) set.
  const stats = useMemo(() => {
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const actorIds = new Set<string>();
    let security = 0;
    let last24h = 0;
    for (const e of entries) {
      if (category(e.action) === 'security') security += 1;
      if (new Date(e.createdAt).getTime() >= dayAgo) last24h += 1;
      if (e.actor) actorIds.add(e.actor.id);
    }
    return { total: entries.length, security, last24h, actors: actorIds.size };
  }, [entries, now]);

  const catCounts = useMemo(() => {
    const c: Record<Category, number> = { security: 0, users: 0, content: 0, other: 0 };
    for (const e of entries) c[category(e.action)] += 1;
    return c;
  }, [entries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (cat === 'all' || category(e.action) === cat) &&
        (action === 'all' || e.action === action) &&
        (q === '' ||
          (e.actor?.displayName ?? 'system').toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          (e.targetType ?? '').toLowerCase().includes(q) ||
          JSON.stringify(e.meta ?? {})
            .toLowerCase()
            .includes(q)),
    );
  }, [entries, query, action, cat]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstRow = rows.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(current * PAGE_SIZE, rows.length);

  const CHIPS: { key: 'all' | Category; label: string; count: number }[] = [
    { key: 'all', label: t('daud.catAll'), count: entries.length },
    { key: 'security', label: t('daud.catSecurity'), count: catCounts.security },
    { key: 'users', label: t('daud.catUsers'), count: catCounts.users },
    { key: 'content', label: t('daud.catContent'), count: catCounts.content },
    { key: 'other', label: t('daud.catOther'), count: catCounts.other },
  ];

  function reset() {
    setPage(1);
    setOpenId(null);
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t('daud.total')} value={stats.total} />
        <StatTile label={t('daud.securityEvents')} value={stats.security} accent />
        <StatTile label={t('daud.last24h')} value={stats.last24h} />
        <StatTile label={t('daud.actors')} value={stats.actors} />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => {
              setCat(chip.key);
              reset();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition ${
              cat === chip.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {chip.label}
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px] text-faint">
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            reset();
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
              reset();
            }}
            placeholder={t('daud.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <th className="px-4 py-3 font-medium">{t('daud.when')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.actor')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.action')}</th>
                <th className="px-4 py-3 font-medium">{t('daud.target')}</th>
                <th className="w-8 px-4 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((e) => {
                const open = openId === e.id;
                const hasMeta = e.meta && Object.keys(e.meta).length > 0;
                return (
                  <Fragment key={e.id}>
                    <tr
                      onClick={() => setOpenId(open ? null : e.id)}
                      className={`cursor-pointer transition-colors hover:bg-surface-2/50 ${
                        category(e.action) === 'security' ? 'bg-accent-red/[0.03]' : ''
                      }`}
                    >
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
                          className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TONE[category(e.action)]}`}
                        >
                          {actionLabel(e.action, t)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-faint">
                        {e.targetType ? `${e.targetType}:${e.targetId?.slice(0, 8) ?? '—'}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-faint">
                        <ChevronRightIcon
                          size={13}
                          className={`transition-transform ${open ? 'rotate-90' : ''}`}
                        />
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-surface-2/40">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="font-mono text-[11px] text-muted">
                            <div className="mb-1 uppercase tracking-wide text-faint">
                              {t('daud.details')}
                            </div>
                            {e.targetId && (
                              <div>
                                target: {e.targetType}:{e.targetId}
                              </div>
                            )}
                            {hasMeta ? (
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-bg/60 p-3 text-[11px] leading-relaxed text-text ring-1 ring-border">
                                {JSON.stringify(e.meta, null, 2)}
                              </pre>
                            ) : (
                              <div className="mt-1 text-faint">{t('daud.noMeta')}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
