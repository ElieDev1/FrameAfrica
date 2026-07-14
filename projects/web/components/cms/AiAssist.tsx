'use client';

import { useState, useTransition } from 'react';
import { CheckIcon, PlusIcon, SparklesIcon } from '@/components/icons';
import {
  headlinesAction,
  summarizeAction,
  tagsAction,
  translateAction,
  type AiResult,
} from '@/lib/ai-actions';
import {
  MIN_ASSIST_CHARS,
  type HeadlineSuggestion,
  type SummarySuggestion,
  type TagSuggestion,
  type TranslationSuggestion,
} from '@/lib/ai-types';

type Suggestion =
  | { kind: 'summary'; data: SummarySuggestion }
  | { kind: 'headlines'; data: HeadlineSuggestion }
  | { kind: 'tags'; data: TagSuggestion }
  | { kind: 'translation'; data: TranslationSuggestion };

export interface AiAssistProps {
  /** Reads the story as it stands right now — the body is edited block by block. */
  getText: () => string;
  getTitle: () => string;
  /** The edition being written, so the suggestion comes back in the right language. */
  language: string;
  onHeadline: (headline: string) => void;
  onStandfirst: (standfirst: string) => void;
  onExcerpt: (excerpt: string) => void;
  onCategory: (name: string) => void;
  onTags: (names: string[]) => void;
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition hover:border-primary/60 hover:text-primary disabled:opacity-50';

/** A one-line suggestion with an "apply it" button beside it. */
function Applyable({ text, onApply }: { text: string; onApply: () => void }) {
  return (
    <li className="flex items-start gap-2 border-t border-border py-2 first:border-t-0 first:pt-0">
      <span className="min-w-0 flex-1 font-body text-sm leading-snug text-text">{text}</span>
      <button
        type="button"
        onClick={onApply}
        title="Use this"
        aria-label={`Use: ${text}`}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border text-muted transition hover:border-primary hover:text-primary"
      >
        <CheckIcon size={12} />
      </button>
    </li>
  );
}

/**
 * Newsroom AI assist, in the story editor's sidebar.
 *
 * It only ever *offers*: nothing it returns reaches the article until the
 * journalist presses the tick beside it. The panel does not render at all when
 * no Anthropic key is configured, so the newsroom is never shown a button that
 * cannot work.
 */
export function AiAssist({
  getText,
  getTitle,
  language,
  onHeadline,
  onStandfirst,
  onExcerpt,
  onCategory,
  onTags,
}: AiAssistProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [target, setTarget] = useState('rw');

  /** Run one assist call, with the same guard rails for all four. */
  function run<T>(
    kind: Suggestion['kind'],
    call: (text: string) => Promise<AiResult<T>>,
    minChars = MIN_ASSIST_CHARS,
  ) {
    const text = getText();
    if (text.length < minChars) {
      setError(`Write at least ${minChars} characters of the story first.`);
      setSuggestion(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await call(text);
      if (!res.ok) {
        setError(res.error);
        setSuggestion(null);
        return;
      }
      setSuggestion({ kind, data: res.data } as Suggestion);
    });
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <SparklesIcon size={13} className="text-primary" />
          AI assist
        </h2>
        <span className="font-mono text-[10px] text-faint">suggestions only</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run('summary', (text) => summarizeAction(text, language))}
        >
          Summary
        </button>
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run('headlines', (text) => headlinesAction(text, language))}
        >
          Headlines
        </button>
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run('tags', (text) => tagsAction(text))}
        >
          Tags
        </button>
        <div className="flex gap-1">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Translate into"
            className="w-14 shrink-0 rounded-lg border border-border bg-surface-2 px-1 font-mono text-[10px] uppercase text-muted outline-none"
          >
            <option value="rw">RW</option>
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="sw">SW</option>
          </select>
          <button
            type="button"
            disabled={pending}
            className={`${btn} min-w-0 flex-1`}
            onClick={() =>
              run('translation', (text) => translateAction(text, target, getTitle()), 1)
            }
          >
            Translate
          </button>
        </div>
      </div>

      {pending && <p className="mt-3 font-mono text-[11px] text-faint">Reading the story…</p>}

      {error && !pending && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2 font-mono text-[11px] leading-snug text-accent-red"
        >
          {error}
        </p>
      )}

      {suggestion && !pending && (
        <div className="mt-3 border-t border-border pt-3">
          {suggestion.kind === 'summary' && (
            <>
              <ul className="flex flex-col">
                <Applyable
                  text={suggestion.data.summary}
                  onApply={() => onExcerpt(suggestion.data.summary)}
                />
              </ul>
              {suggestion.data.bullets.length > 0 && (
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 font-body text-[13px] leading-snug text-muted">
                  {suggestion.data.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {suggestion.kind === 'headlines' && (
            <>
              <ul className="flex flex-col">
                {suggestion.data.headlines.map((headline) => (
                  <Applyable key={headline} text={headline} onApply={() => onHeadline(headline)} />
                ))}
              </ul>
              {suggestion.data.standfirst && (
                <ul className="mt-2 flex flex-col border-t border-border pt-2">
                  <Applyable
                    text={suggestion.data.standfirst}
                    onApply={() => onStandfirst(suggestion.data.standfirst)}
                  />
                </ul>
              )}
            </>
          )}

          {suggestion.kind === 'tags' && (
            <div className="flex flex-col gap-2.5">
              {suggestion.data.category && (
                <ul className="flex flex-col">
                  <Applyable
                    text={`Section: ${suggestion.data.category}`}
                    onApply={() => onCategory(suggestion.data.category!)}
                  />
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {suggestion.data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {suggestion.data.tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => onTags(suggestion.data.tags)}
                  className={`${btn} w-full`}
                >
                  <PlusIcon size={12} />
                  Select matching topics
                </button>
              )}
            </div>
          )}

          {suggestion.kind === 'translation' && (
            <div className="flex flex-col gap-2">
              {suggestion.data.title && (
                <ul className="flex flex-col">
                  <Applyable
                    text={suggestion.data.title}
                    onApply={() => onHeadline(suggestion.data.title!)}
                  />
                </ul>
              )}
              <textarea
                readOnly
                value={suggestion.data.text}
                rows={10}
                aria-label="Translated draft"
                className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-[13px] leading-relaxed text-text outline-none"
              />
              <p className="font-mono text-[10px] leading-snug text-faint">
                Copy this into a new draft in that edition — it is a translation to edit, not
                finished copy.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
