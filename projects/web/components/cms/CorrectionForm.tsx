'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useT } from '@/components/LocaleProvider';
import { addCorrectionAction, type CorrectionState } from '@/lib/cms-actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg border border-accent-yellow px-4 py-2 font-mono text-xs uppercase tracking-wide text-accent-yellow transition hover:bg-accent-yellow hover:text-black disabled:opacity-60"
    >
      {pending ? t('dcf.adding') : t('dcf.addCorrection')}
    </button>
  );
}

/**
 * Editor-only: append a public, dated correction/retraction to a published
 * article. The note appears on the public article page and is append-only.
 */
export function CorrectionForm({ articleId }: { articleId: string }) {
  const t = useT();
  const action = addCorrectionAction.bind(null, articleId);
  const [state, formAction] = useActionState<CorrectionState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Add a correction
        </span>
        <textarea
          name="note"
          rows={2}
          maxLength={1000}
          required
          placeholder={t('dcf.placeholder')}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      {state.savedAt && <p className="font-mono text-xs text-accent-green">Correction added ✓</p>}
      <SubmitButton />
    </form>
  );
}
