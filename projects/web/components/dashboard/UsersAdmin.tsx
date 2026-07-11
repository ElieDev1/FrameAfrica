'use client';

import { useMemo, useState, useTransition } from 'react';
import { ChevronRightIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import { createUser, resetUserPassword, setUserRoles, setUserStatus } from '@/lib/admin-actions';
import { type AdminUser, ROLE_NAMES, type RoleName, type UserStatus } from '@/lib/admin-types';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/lib/i18n';

const PAGE_SIZE = 12;
const STAFF_ROLES = new Set([
  'journalist',
  'sub_editor',
  'photographer',
  'editor',
  'moderator',
  'ads_manager',
  'admin',
]);

function roleLabel(role: string, t: (k: MessageKey) => string): string {
  const key = `drole.${role}` as MessageKey;
  const translated = t(key);
  return translated === key ? role.replace(/_/g, ' ') : translated;
}

function isStaff(u: AdminUser): boolean {
  return u.roles.some((r) => STAFF_ROLES.has(r));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const TABS: { key: string; labelKey: MessageKey; match: (u: AdminUser) => boolean }[] = [
  { key: 'all', labelKey: 'dusr.tabAll', match: () => true },
  { key: 'active', labelKey: 'dusr.tabActive', match: (u) => u.status === 'active' },
  { key: 'suspended', labelKey: 'dusr.tabSuspended', match: (u) => u.status === 'suspended' },
  { key: 'staff', labelKey: 'dusr.tabStaff', match: (u) => isStaff(u) },
  { key: 'readers', labelKey: 'dusr.tabReaders', match: (u) => !isStaff(u) },
];

/** Avatar photo, or an initials monogram. */
function Avatar({ user }: { user: AdminUser }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar, arbitrary host
      <img
        src={user.avatarUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-heading text-xs font-black text-primary ring-1 ring-primary/20">
      {initials(user.displayName)}
    </span>
  );
}

/** New-user form; on success surfaces the generated password once. */
function CreateUser({ onCreated }: { onCreated: (u: AdminUser) => void }) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [displayName, setName] = useState('');
  const [roles, setRoles] = useState<RoleName[]>(['journalist']);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function toggleRole(role: RoleName) {
    setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createUser({ email: email.trim(), displayName: displayName.trim(), roles });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.user && res.temporaryPassword) {
        setTempPassword({ email: res.user.email, password: res.temporaryPassword });
        onCreated(res.user);
        setEmail('');
        setName('');
        setRoles(['journalist']);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-heading text-lg font-bold text-text">{t('dusr.createUser')}</h2>
      <p className="mt-1 font-body text-sm text-muted">{t('dusr.createDesc')}</p>

      {tempPassword && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="font-body text-sm text-text">
            {t('dusr.accountCreatedFor')} <strong>{tempPassword.email}</strong>.{' '}
            {t('dusr.tempPassword')}
          </p>
          <code className="mt-2 block select-all rounded bg-bg px-3 py-2 font-mono text-sm text-primary">
            {tempPassword.password}
          </code>
          <button
            type="button"
            onClick={() => setTempPassword(null)}
            className="mt-2 font-mono text-[11px] text-muted hover:text-text"
          >
            {t('dusr.dismiss')}
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {t('dusr.email')}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
            placeholder="name@frameafrica.rw"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {t('dusr.displayName')}
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
            placeholder={t('dusr.namePlaceholder')}
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {t('dusr.roles')}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLE_NAMES.map((role) => (
            <label
              key={role}
              className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] capitalize transition-colors ${
                roles.includes(role)
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {roleLabel(role, t)}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="mt-3 font-mono text-xs text-accent-red">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-4 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? t('dusr.creating') : t('dusr.createUser')}
      </button>
    </section>
  );
}

/** Inline role editor for a row. */
function RoleEditor({ user, onSaved }: { user: AdminUser; onSaved: (roles: string[]) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<string[]>(user.roles);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(role: RoleName) {
    setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setUserRoles(user.id, roles);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSaved(roles);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {user.roles.map((r) => (
          <span
            key={r}
            className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] capitalize text-muted"
          >
            {roleLabel(r, t)}
          </span>
        ))}
        <button
          type="button"
          onClick={() => {
            setRoles(user.roles);
            setOpen(true);
          }}
          className="ml-1 font-mono text-[10px] text-primary hover:underline"
        >
          {t('d.common.edit')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {ROLE_NAMES.map((role) => (
          <label
            key={role}
            className={`cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[10px] capitalize ${
              roles.includes(role)
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={roles.includes(role)}
              onChange={() => toggle(role)}
            />
            {roleLabel(role, t)}
          </label>
        ))}
      </div>
      {error && <span className="font-mono text-[10px] text-accent-red">{error}</span>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="font-mono text-[10px] text-primary hover:underline disabled:opacity-50"
        >
          {t('d.common.save')}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] text-muted hover:underline"
        >
          {t('dusr.cancel')}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const t = useT();
  const tone =
    status === 'active'
      ? 'text-primary'
      : status === 'suspended'
        ? 'text-accent-red'
        : 'text-faint';
  const key = (
    status === 'active' ? 'dusr.active' : status === 'suspended' ? 'dusr.suspended' : 'dusr.deleted'
  ) as MessageKey;
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${tone}`}>{t(key)}</span>
  );
}

/** One user table row with role editor, status toggle + reset-password. */
function UserRow({ user, onChange }: { user: AdminUser; onChange: (u: AdminUser) => void }) {
  const t = useT();
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleStatus() {
    const next: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    startTransition(async () => {
      const res = await setUserStatus(user.id, next);
      if (!res.error) onChange({ ...user, status: next });
      else setNote(res.error);
    });
  }

  function reset() {
    setNote(null);
    startTransition(async () => {
      const res = await resetUserPassword(user.id);
      setNote(res.error ?? `${t('dusr.passwordEmailedTo')} ${res.email}`);
    });
  }

  return (
    <tr className="group align-top transition-colors hover:bg-surface-2/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-heading font-bold text-text">{user.displayName}</span>
              {user.mustChangePassword && (
                <span className="shrink-0 rounded bg-accent-yellow/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-accent-yellow">
                  {t('dusr.invited')}
                </span>
              )}
            </div>
            <div className="truncate font-mono text-[11px] text-muted">{user.email}</div>
            {note && <div className="mt-1 font-mono text-[10px] text-primary">{note}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleEditor user={user} onSaved={(roles) => onChange({ ...user, roles })} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={pending || user.status === 'deleted'}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {user.status === 'active' ? t('dusr.suspend') : t('dusr.activate')}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {t('dusr.resetPassword')}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function UsersAdmin({ initial }: { initial: AdminUser[] }) {
  const tr = useT();
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.key] = users.filter(t.match).length;
    return c;
  }, [users]);

  const rows = useMemo(() => {
    const active = TABS.find((t) => t.key === tab) ?? TABS[0];
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        active.match(u) &&
        (q === '' ||
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.roles.some((r) => r.includes(q))),
    );
  }, [users, tab, query]);

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

  function upsert(u: AdminUser) {
    setUsers((list) => {
      const i = list.findIndex((x) => x.id === u.id);
      if (i === -1) return [u, ...list];
      const next = [...list];
      next[i] = u;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-text">
            {tr('dash.users')}
          </h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-muted">{tr('dusr.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
        >
          <PlusIcon size={16} /> {tr('dusr.createUser')}
        </button>
      </div>

      {showCreate && <CreateUser onCreated={(u) => upsert(u)} />}

      {/* Toolbar: tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label={tr('dusr.filterUsers')}>
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
            placeholder={tr('dusr.searchPlaceholder')}
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
                <th className="px-4 py-3 font-medium">{tr('dusr.user')}</th>
                <th className="px-4 py-3 font-medium">{tr('dusr.roles')}</th>
                <th className="px-4 py-3 font-medium">{tr('dusr.status')}</th>
                <th className="px-4 py-3 font-medium">{tr('dusr.lastActive')}</th>
                <th className="px-4 py-3 text-right font-medium">{tr('dusr.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((u) => (
                <UserRow key={u.id} user={u} onChange={upsert} />
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-4 py-12 text-center font-body text-sm text-muted">
            {query ? tr('dusr.noMatch') : tr('dusr.noUsers')}
          </p>
        )}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
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
