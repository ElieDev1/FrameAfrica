'use client';

import type { ReactNode } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Block } from '@/lib/api';
import type { CategoryOption } from '@/lib/cms';
import type { DraftFormState } from '@/lib/cms-actions';
import { BlockEditor } from './BlockEditor';

const LANGUAGES = [
  ['en', 'English'],
  ['rw', 'Kinyarwanda'],
  ['fr', 'French'],
  ['sw', 'Kiswahili'],
] as const;

type Action = (prev: DraftFormState, formData: FormData) => Promise<DraftFormState>;

export interface DraftInitial {
  title: string;
  categoryId: string;
  subtitle: string;
  excerpt: string;
  body: string;
  blocks: Block[] | null;
  language: string;
  isPremium: boolean;
  featuredImageUrl: string;
  featuredImageAlt: string;
  featuredImageCredit: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-text outline-none focus:border-primary';

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition disabled:opacity-60"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function DraftForm({
  action,
  categories,
  initial,
  mode,
}: {
  action: Action;
  categories: CategoryOption[];
  initial?: DraftInitial;
  mode: 'create' | 'edit';
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Headline">
        <input
          name="title"
          defaultValue={initial?.title}
          required
          minLength={3}
          maxLength={200}
          className={inputClass}
        />
      </Field>

      <Field label="Section">
        <select
          name="categoryId"
          defaultValue={initial?.categoryId ?? ''}
          required
          className={inputClass}
        >
          <option value="" disabled>
            Choose a section…
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Standfirst (subtitle)">
        <input
          name="subtitle"
          defaultValue={initial?.subtitle}
          maxLength={300}
          className={inputClass}
        />
      </Field>

      <Field label="Excerpt">
        <textarea
          name="excerpt"
          defaultValue={initial?.excerpt}
          maxLength={500}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-end gap-6">
        <Field label="Language">
          <select name="language" defaultValue={initial?.language ?? 'en'} className={inputClass}>
            {LANGUAGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2 font-body text-sm text-muted">
          <input type="checkbox" name="isPremium" defaultChecked={initial?.isPremium} />
          Premium (subscribers only)
        </label>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Featured image
        </legend>
        <Field label="Image URL">
          <input
            name="featuredImageUrl"
            type="url"
            defaultValue={initial?.featuredImageUrl}
            maxLength={500}
            placeholder="https://…  (upload coming soon)"
            className={inputClass}
          />
        </Field>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[16rem] flex-1">
            <Field label="Alt text (for accessibility)">
              <input
                name="featuredImageAlt"
                defaultValue={initial?.featuredImageAlt}
                maxLength={300}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="min-w-[10rem] flex-1">
            <Field label="Credit">
              <input
                name="featuredImageCredit"
                defaultValue={initial?.featuredImageCredit}
                maxLength={200}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Article body
        </span>
        <BlockEditor initialBlocks={initial?.blocks} initialBody={initial?.body ?? ''} />
      </div>

      {mode === 'edit' && (
        <Field label="Change note (optional)">
          <input name="changeNote" maxLength={300} className={inputClass} />
        </Field>
      )}

      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      {state.savedAt && <p className="font-mono text-xs text-accent-green">Saved ✓</p>}

      <div>
        <SaveButton label={mode === 'create' ? 'Create draft' : 'Save changes'} />
      </div>
    </form>
  );
}
