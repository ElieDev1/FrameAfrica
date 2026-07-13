'use client';

import type { ReactNode } from 'react';
import { useActionState, useCallback, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  CheckIcon,
  ImageIcon,
  type IconProps,
  SettingsIcon,
  TagIcon,
  TrashIcon,
} from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import { blocksToText } from '@/lib/ai-types';
import type { Block } from '@/lib/api';
import type { CategoryOption, TopicOption } from '@/lib/cms';
import type { DraftFormState } from '@/lib/cms-actions';
import { AiAssist } from './AiAssist';
import { BlockEditor } from './BlockEditor';
import { MediaPicker } from './MediaPicker';

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
  topicSlugs: string[];
  language: string;
  isPremium: boolean;
  featuredImageUrl: string;
  featuredImageAlt: string;
  featuredImageCredit: string;
}

const inputClass =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

/** Live character budget — turns red as the limit approaches. */
function Counter({ value, max }: { value: number; max: number }) {
  const tight = value > max * 0.9;
  return (
    <span
      className={`shrink-0 font-mono text-[10px] tabular-nums ${tight ? 'text-accent-red' : 'text-faint'}`}
    >
      {value}/{max}
    </span>
  );
}

function Field({
  label,
  counter,
  hint,
  children,
}: {
  label: string;
  counter?: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        {counter}
      </span>
      {children}
      {hint && <span className="font-mono text-[10px] leading-snug text-faint">{hint}</span>}
    </label>
  );
}

/** A titled settings card for the editor sidebar. */
function Panel({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: (p: IconProps) => ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <Icon size={13} className="text-faint" />
          {title}
        </h2>
        {badge}
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

/** An accessible on/off switch that still posts a plain checkbox value. */
function Toggle({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block font-body text-sm font-semibold text-text">{label}</span>
        {hint && (
          <span className="mt-0.5 block font-mono text-[10px] leading-snug text-faint">{hint}</span>
        )}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-2 ring-1 ring-border transition peer-checked:bg-primary peer-checked:ring-primary peer-checked:[&>span]:translate-x-4">
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
      </span>
    </label>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      <CheckIcon size={15} />
      {pending ? t('d.common.saving') : label}
    </button>
  );
}

export function DraftForm({
  action,
  categories,
  topics,
  initial,
  mode,
  aiEnabled = false,
}: {
  action: Action;
  categories: CategoryOption[];
  topics: TopicOption[];
  initial?: DraftInitial;
  mode: 'create' | 'edit';
  /** True when an Anthropic key is configured — otherwise the assist panel is not shown. */
  aiEnabled?: boolean;
}) {
  const t = useT();
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [featured, setFeatured] = useState({
    url: initial?.featuredImageUrl ?? '',
    alt: initial?.featuredImageAlt ?? '',
    credit: initial?.featuredImageCredit ?? '',
  });
  // Live budgets for the headline / standfirst / excerpt.
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [language, setLanguage] = useState(initial?.language ?? 'en');
  const [picked, setPicked] = useState<Set<string>>(new Set(initial?.topicSlugs ?? []));

  function toggleTopic(slug: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  /**
   * The story as it stands. The body lives inside the block editor's own state
   * and reaches the form as serialised JSON, so the assist reads that hidden
   * field rather than duplicating the editor's state up here.
   */
  const currentText = useCallback((): string => {
    const field = formRef.current?.elements.namedItem('blocks');
    const raw = field instanceof HTMLInputElement ? field.value : '';
    try {
      return blocksToText(JSON.parse(raw) as Block[]);
    } catch {
      return '';
    }
  }, []);

  /** Tick the topics the assist suggested that the newsroom actually has. */
  function selectSuggestedTopics(names: string[]) {
    const wanted = new Set(names.map((n) => n.toLowerCase()));
    const slugs = topics.filter((t) => wanted.has(t.name.toLowerCase())).map((t) => t.slug);
    setPicked((prev) => new Set([...prev, ...slugs]));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      {/* ── Writing column ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-col gap-5">
        {/* Headline — the hero of the editor */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {t('ddf.headline')}
            </span>
            <Counter value={title.length} max={200} />
          </div>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={200}
            placeholder={t('ddf.writeHeadline')}
            className="mt-1 w-full bg-transparent font-heading text-3xl font-black leading-tight tracking-tight text-text outline-none placeholder:font-normal placeholder:text-faint"
          />
          <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {t('ddf.standfirst')}
            </span>
            <Counter value={subtitle.length} max={300} />
          </div>
          <input
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={300}
            className="mt-1 w-full bg-transparent font-body text-base leading-relaxed text-muted outline-none placeholder:text-faint"
          />
        </div>

        {/* Body */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {t('ddf.articleBody')}
          </span>
          <BlockEditor initialBlocks={initial?.blocks} initialBody={initial?.body ?? ''} />
        </div>

        {mode === 'edit' && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <Field label={t('ddf.changeNote')}>
              <input name="changeNote" maxLength={300} className={inputClass} />
            </Field>
          </div>
        )}
      </div>

      {/* ── Settings sidebar ───────────────────────────────────────── */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        {/* Publish — always in reach */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              {t('ddf.publish')}
            </h2>
            <span className="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${state.savedAt ? 'bg-accent-green' : 'bg-faint'}`}
              />
              <span className={state.savedAt ? 'text-accent-green' : 'text-faint'}>
                {state.savedAt ? t('ddf.saved') : t('ddf.unsaved')}
              </span>
            </span>
          </div>
          {state.error && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] leading-snug text-accent-red"
            >
              {state.error}
            </p>
          )}
          <SaveButton label={mode === 'create' ? t('ddf.createDraft') : t('ddf.saveChanges')} />
        </section>

        {aiEnabled && (
          <AiAssist
            getText={currentText}
            getTitle={() => title}
            language={language}
            onHeadline={setTitle}
            onStandfirst={setSubtitle}
            onExcerpt={setExcerpt}
            onCategory={(name) => {
              const match = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
              if (match) setCategoryId(match.id);
            }}
            onTags={selectSuggestedTopics}
          />
        )}

        <Panel title={t('ddf.details')} icon={SettingsIcon}>
          <Field label={t('ddf.section')}>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                {t('ddf.chooseSection')}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('ddf.language')}>
            <select
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClass}
            >
              {LANGUAGES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('ddf.excerpt')} counter={<Counter value={excerpt.length} max={500} />}>
            <textarea
              name="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={500}
              rows={3}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </Field>
          <div className="border-t border-border pt-3">
            <Toggle
              name="isPremium"
              defaultChecked={initial?.isPremium}
              label={t('ddf.premium')}
              hint={t('ddf.premiumHint')}
            />
          </div>
        </Panel>

        <Panel title={t('ddf.featuredImage')} icon={ImageIcon}>
          {featured.url ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview, arbitrary host */}
              <img
                src={featured.url}
                alt=""
                className="aspect-[16/9] w-full rounded-lg object-cover ring-1 ring-border"
              />
              <button
                type="button"
                onClick={() => setFeatured({ url: '', alt: '', credit: '' })}
                aria-label={t('ddf.removeImage')}
                title={t('ddf.removeImage')}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-accent-red"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ) : (
            <div className="grid aspect-[16/9] place-items-center rounded-lg border border-dashed border-border bg-surface-2 text-faint">
              <div className="text-center">
                <ImageIcon size={22} className="mx-auto" />
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide">
                  {t('ddf.noImage')}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Field label={t('ddf.imageUrl')}>
                <input
                  name="featuredImageUrl"
                  value={featured.url}
                  onChange={(e) => setFeatured((f) => ({ ...f, url: e.target.value }))}
                  maxLength={500}
                  placeholder="/uploads/…  or  https://…"
                  className={inputClass}
                />
              </Field>
            </div>
            <MediaPicker
              onSelect={(a) =>
                setFeatured({ url: a.url, alt: a.alt ?? '', credit: a.credit ?? '' })
              }
            />
          </div>
          <Field label={t('ddf.altAccessibility')}>
            <input
              name="featuredImageAlt"
              value={featured.alt}
              onChange={(e) => setFeatured((f) => ({ ...f, alt: e.target.value }))}
              maxLength={300}
              className={inputClass}
            />
          </Field>
          <Field label={t('ddf.credit')}>
            <input
              name="featuredImageCredit"
              value={featured.credit}
              onChange={(e) => setFeatured((f) => ({ ...f, credit: e.target.value }))}
              maxLength={200}
              className={inputClass}
            />
          </Field>
        </Panel>

        {topics.length > 0 && (
          <Panel
            title={t('ddf.topics')}
            icon={TagIcon}
            badge={
              picked.size > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {picked.size} {t('ddf.selected')}
                </span>
              ) : undefined
            }
          >
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <label
                  key={topic.slug}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted transition hover:border-primary/60 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="checkbox"
                    name="topics"
                    value={topic.slug}
                    checked={picked.has(topic.slug)}
                    onChange={(e) => toggleTopic(topic.slug, e.target.checked)}
                    className="sr-only"
                  />
                  {topic.name}
                </label>
              ))}
            </div>
          </Panel>
        )}
      </aside>
    </form>
  );
}
