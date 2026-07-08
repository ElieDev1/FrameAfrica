'use client';

import { useMemo, useState, useTransition } from 'react';
import { type AdminUser, ROLE_NAMES, type RoleName, type UserStatus } from '@/lib/admin-types';
import { createUser, resetUserPassword, setUserRoles, setUserStatus } from '@/lib/admin-actions';

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ');
}

/** New-user form; on success surfaces the generated password once. */
function CreateUser({ onCreated }: { onCreated: (u: AdminUser) => void }) {
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
      <h2 className="font-heading text-lg font-bold text-text">Create a user</h2>
      <p className="mt-1 font-body text-sm text-muted">
        A temporary password is generated. Hand it to the person — they set their own at first
        sign-in.
      </p>

      {tempPassword && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="font-body text-sm text-text">
            Account created for <strong>{tempPassword.email}</strong>. Temporary password (shown
            once):
          </p>
          <code className="mt-2 block select-all rounded bg-bg px-3 py-2 font-mono text-sm text-primary">
            {tempPassword.password}
          </code>
          <button
            type="button"
            onClick={() => setTempPassword(null)}
            className="mt-2 font-mono text-[11px] text-muted hover:text-text"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Email
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
            Display name
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
            placeholder="Jane Uwase"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Roles
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
              {roleLabel(role)}
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
        {pending ? 'Creating…' : 'Create user'}
      </button>
    </section>
  );
}

/** Inline role editor for a row. */
function RoleEditor({ user, onSaved }: { user: AdminUser; onSaved: (roles: string[]) => void }) {
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
            {roleLabel(r)}
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
          edit
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
            {roleLabel(role)}
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
          save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] text-muted hover:underline"
        >
          cancel
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const tone =
    status === 'active'
      ? 'text-primary'
      : status === 'suspended'
        ? 'text-accent-red'
        : 'text-faint';
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${tone}`}>{status}</span>
  );
}

/** One user row with status toggle + reset-password. */
function UserRow({ user, onChange }: { user: AdminUser; onChange: (u: AdminUser) => void }) {
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
      setNote(res.error ?? `New password emailed to ${res.email}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-t border-border px-4 py-3 md:grid-cols-[2fr_2fr_1fr_1.4fr] md:items-start">
      <div>
        <div className="font-body text-sm text-text">{user.displayName}</div>
        <div className="font-mono text-[11px] text-muted">{user.email}</div>
        {note && <div className="mt-1 font-mono text-[10px] text-primary">{note}</div>}
      </div>
      <RoleEditor user={user} onSaved={(roles) => onChange({ ...user, roles })} />
      <StatusBadge status={user.status} />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending || user.status === 'deleted'}
          className="font-mono text-[11px] text-muted hover:text-text disabled:opacity-40"
        >
          {user.status === 'active' ? 'Suspend' : 'Activate'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="font-mono text-[11px] text-muted hover:text-primary disabled:opacity-40"
        >
          Reset password
        </button>
      </div>
    </div>
  );
}

export function UsersAdmin({ initial }: { initial: AdminUser[] }) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.roles.some((r) => r.includes(q)),
    );
  }, [users, query]);

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
    <div className="flex flex-col gap-6">
      <CreateUser onCreated={upsert} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-bold text-text">
            All users <span className="font-mono text-sm text-muted">({users.length})</span>
          </h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, email, role…"
            className="w-64 max-w-full rounded-lg border border-border bg-bg px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:grid md:grid-cols-[2fr_2fr_1fr_1.4fr]">
            <span>User</span>
            <span>Roles</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {filtered.map((u) => (
            <UserRow key={u.id} user={u} onChange={upsert} />
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center font-body text-sm text-muted">No matching users.</p>
          )}
        </div>
      </section>
    </div>
  );
}
