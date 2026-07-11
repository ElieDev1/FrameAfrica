'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { postComment } from '@/lib/comments-actions';
import { useT } from '@/components/LocaleProvider';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition disabled:opacity-60"
    >
      {pending ? t('comments.posting') : t('comments.post')}
    </button>
  );
}

export function CommentForm({ articleId, slug }: { articleId: string; slug: string }) {
  const action = postComment.bind(null, articleId, slug);
  const [state, formAction] = useActionState(action, {});
  const t = useT();

  return (
    <form action={formAction} className="flex flex-col gap-3" key={state.ok ? 'posted' : 'idle'}>
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={t('comments.placeholder')}
        className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-body text-text outline-none focus:border-primary"
      />
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="font-mono text-xs text-accent-green">{t('comments.postedSuccess')}</p>
      )}
      <SubmitButton />
    </form>
  );
}
