'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckIcon } from '@/components/icons';
import { type InquiryFormState, submitInquiry } from '@/lib/inquiry-actions';
import { useT } from '@/components/LocaleProvider';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted';

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-5 py-2.5 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t('common.sending') : children}
    </button>
  );
}

export function InquiryForm({ type }: { type: 'advertise' | 'contact' }) {
  const [state, action] = useActionState<InquiryFormState, FormData>(submitInquiry, {});
  const t = useT();

  if (state.success) {
    return (
      <div className="rounded-2xl border border-accent-green/40 bg-accent-green/10 p-6">
        <p className="flex items-center gap-2 font-heading text-lg font-bold text-text">
          <CheckIcon size={18} className="text-accent-green" /> {t('inquiry.successTitle')}
        </p>
        <p className="mt-1 font-body text-sm text-muted">
          {type === 'advertise' ? t('inquiry.successAdvertise') : t('inquiry.successContact')}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-6">
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>{t('inquiry.name')}</span>
          <input name="name" required minLength={2} maxLength={120} className={field} />
        </label>
        <label>
          <span className={label}>{t('auth.email')}</span>
          <input name="email" type="email" required maxLength={200} className={field} />
        </label>
        {type === 'advertise' ? (
          <>
            <label>
              <span className={label}>{t('inquiry.company')}</span>
              <input name="company" maxLength={160} className={field} />
            </label>
            <label>
              <span className={label}>{t('inquiry.placement')}</span>
              <select name="placement" defaultValue="" className={field}>
                <option value="">{t('inquiry.notSure')}</option>
                <option value="leaderboard">Leaderboard</option>
                <option value="billboard">Billboard</option>
                <option value="rectangle">Rectangle</option>
                <option value="halfpage">Half page</option>
                <option value="native">Native / in-feed</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={label}>{t('inquiry.budget')}</span>
              <input
                name="budget"
                maxLength={80}
                placeholder="e.g. $500 / month"
                className={field}
              />
            </label>
          </>
        ) : (
          <label className="sm:col-span-2">
            <span className={label}>{t('inquiry.subject')}</span>
            <input name="subject" maxLength={160} className={field} />
          </label>
        )}
        <label className="sm:col-span-2">
          <span className={label}>{t('inquiry.message')}</span>
          <textarea
            name="message"
            required
            minLength={5}
            maxLength={5000}
            rows={5}
            className={field}
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}

      <div className="mt-4">
        <SubmitButton>
          {type === 'advertise' ? t('inquiry.sendEnquiry') : t('inquiry.sendMessage')}
        </SubmitButton>
      </div>
    </form>
  );
}
