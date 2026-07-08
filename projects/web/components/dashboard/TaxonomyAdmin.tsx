'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  createCategory,
  createTopic,
  deleteCategory,
  deleteTopic,
  updateCategory,
} from '@/lib/taxonomy-actions';
import type { AdminCategory, AdminTopic } from '@/lib/taxonomy-types';

function Count({ n, label }: { n: number; label: string }) {
  return (
    <span className="font-mono text-[10px] text-faint">
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
    <div className="border-t border-border px-4 py-2" style={{ paddingLeft: 16 + depth * 20 }}>
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1 font-body text-sm text-text outline-none focus:border-primary"
          />
        ) : (
          <span className="font-body text-sm text-text">{cat.name}</span>
        )}
        <span className="font-mono text-[10px] text-muted">/{cat.slug}</span>
        <Count n={cat.articleCount} label="article" />
        {cat.childCount > 0 && <Count n={cat.childCount} label="sub" />}
        <span className="ml-auto flex gap-3">
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="font-mono text-[11px] text-primary hover:underline"
              >
                save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="font-mono text-[11px] text-muted hover:underline"
              >
                cancel
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
                className="font-mono text-[11px] text-primary hover:underline"
              >
                rename
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="font-mono text-[11px] text-muted hover:text-accent-red"
              >
                delete
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

  // Order as a parent→children tree.
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
    <section className="overflow-hidden rounded-xl border border-border">
      <div className="bg-surface px-4 py-3">
        <h2 className="font-heading text-lg font-bold text-text">Sections</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New section name"
            className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          />
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
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
            className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
          {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      </div>
      {ordered.map(({ cat, depth }) => (
        <CategoryRow key={cat.id} cat={cat} depth={depth} onChanged={onChanged} />
      ))}
    </section>
  );
}

function Topics({ topics, onChanged }: { topics: AdminTopic[]; onChanged: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
    <section className="overflow-hidden rounded-xl border border-border">
      <div className="bg-surface px-4 py-3">
        <h2 className="font-heading text-lg font-bold text-text">Topics</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New topic name"
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 font-body text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !name.trim()}
            className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
          {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {topics.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted"
          >
            {t.name}
            <span className="text-faint">({t.articleCount})</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              disabled={pending}
              className="text-muted hover:text-accent-red"
              aria-label={`Delete ${t.name}`}
            >
              ✕
            </button>
          </span>
        ))}
        {topics.length === 0 && <p className="font-body text-sm text-muted">No topics yet.</p>}
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
    <div className="flex flex-col gap-6">
      <Sections categories={categories} onChanged={refresh} />
      <Topics topics={topics} onChanged={refresh} />
    </div>
  );
}
