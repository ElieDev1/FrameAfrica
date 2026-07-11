'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { LayersIcon, PenIcon, PlusIcon, SearchIcon, TagIcon, TrashIcon } from '@/components/icons';
import {
  createCategory,
  createTopic,
  deleteCategory,
  deleteTopic,
  updateCategory,
} from '@/lib/taxonomy-actions';
import type { AdminCategory, AdminTopic } from '@/lib/taxonomy-types';

function CountPill({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {n} {label}
      {n === 1 ? '' : 's'}
    </span>
  );
}

function CategoryRow({
  cat,
  depth,
  onChanged,
}: {
  cat: AdminCategory;
  depth: number;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await updateCategory(cat.id, { name });
      if (res.error) setError(res.error);
      else {
        setEditing(false);
        onChanged();
      }
    });
  }
  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteCategory(cat.id);
      if (res.error) setError(res.error);
      else onChanged();
    });
  }

  return (
    <div
      className="group border-t border-border px-4 py-2.5 transition-colors hover:bg-surface-2/40"
      style={{ paddingLeft: 16 + depth * 26 }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {depth > 0 && (
          <span aria-hidden className="font-mono text-faint">
            ↳
          </span>
        )}
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 font-body text-sm text-text outline-none focus:border-primary"
          />
        ) : (
          <span
            className={`text-text ${depth === 0 ? 'font-heading font-bold' : 'font-body text-sm'}`}
          >
            {cat.name}
          </span>
        )}
        <span className="font-mono text-[10px] text-faint">/{cat.slug}</span>
        <CountPill n={cat.articleCount} label="article" />
        {cat.childCount > 0 && <CountPill n={cat.childCount} label="sub" />}

        <span className="ml-auto flex items-center gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-primary transition hover:border-primary disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted transition hover:text-text"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setName(cat.name);
                  setEditing(true);
                }}
                aria-label={`Rename ${cat.name}`}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-surface-2 hover:text-primary group-hover:opacity-100"
              >
                <PenIcon size={13} />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                aria-label={`Delete ${cat.name}`}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-accent-red/10 hover:text-accent-red group-hover:opacity-100 disabled:opacity-40"
              >
                <TrashIcon size={13} />
              </button>
            </>
          )}
        </span>
      </div>
      {error && <p className="mt-1 font-mono text-[10px] text-accent-red">{error}</p>}
    </div>
  );
}

function Sections({
  categories,
  onChanged,
}: {
  categories: AdminCategory[];
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ordered = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    const rows: { cat: AdminCategory; depth: number }[] = [];
    for (const root of roots) {
      rows.push({ cat: root, depth: 0 });
      for (const child of categories.filter((c) => c.parentId === root.id)) {
        rows.push({ cat: child, depth: 1 });
      }
    }
    return rows;
  }, [categories]);

  function add() {
    setError(null);
    start(async () => {
      const res = await createCategory({ name, parentId: parentId || undefined });
      if (res.error) setError(res.error);
      else {
        setName('');
        setParentId('');
        onChanged();
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <LayersIcon size={15} className="text-primary" />
          <h2 className="font-heading text-sm font-bold text-text">Sections</h2>
          <CountPill n={categories.length} label="section" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New section name"
            className="w-48 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          />
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          >
            <option value="">— top level —</option>
            {categories
              .filter((c) => !c.parentId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  under {c.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={pending || !name.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            <PlusIcon size={14} /> Add
          </button>
          {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      </div>
      {ordered.map(({ cat, depth }) => (
        <CategoryRow key={cat.id} cat={cat} depth={depth} onChanged={onChanged} />
      ))}
      {ordered.length === 0 && (
        <p className="px-4 py-8 text-center font-body text-sm text-muted">No sections yet.</p>
      )}
    </section>
  );
}

function Topics({ topics, onChanged }: { topics: AdminTopic[]; onChanged: () => void }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? topics.filter((t) => t.name.toLowerCase().includes(q)) : topics;
  }, [topics, query]);

  function add() {
    setError(null);
    start(async () => {
      const res = await createTopic({ name });
      if (res.error) setError(res.error);
      else {
        setName('');
        onChanged();
      }
    });
  }
  function remove(id: string) {
    setError(null);
    start(async () => {
      const res = await deleteTopic(id);
      if (res.error) setError(res.error);
      else onChanged();
    });
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TagIcon size={15} className="text-primary" />
          <h2 className="font-heading text-sm font-bold text-text">Topics</h2>
          <CountPill n={topics.length} label="topic" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New topic name"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !name.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            <PlusIcon size={14} /> Add
          </button>
          {error && <span className="w-full font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
        {topics.length > 8 && (
          <label className="relative mt-2 block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <SearchIcon size={14} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter topics…"
              className="w-full rounded-lg border border-border bg-surface-2 py-1.5 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {shown.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-[11px] text-text"
          >
            {t.name}
            <span className="text-faint">({t.articleCount})</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              disabled={pending}
              className="text-faint transition hover:text-accent-red"
              aria-label={`Delete ${t.name}`}
            >
              ✕
            </button>
          </span>
        ))}
        {shown.length === 0 && (
          <p className="font-body text-sm text-muted">
            {query ? 'No topics match.' : 'No topics yet.'}
          </p>
        )}
      </div>
    </section>
  );
}

export function TaxonomyAdmin({
  categories,
  topics,
}: {
  categories: AdminCategory[];
  topics: AdminTopic[];
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Taxonomy</h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">
          Manage the sections, sub-sections, and topics that organise the whole site. A section with
          sub-sections or articles can&apos;t be deleted until it&apos;s emptied.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <Sections categories={categories} onChanged={refresh} />
        <Topics topics={topics} onChanged={refresh} />
      </div>
    </div>
  );
}
