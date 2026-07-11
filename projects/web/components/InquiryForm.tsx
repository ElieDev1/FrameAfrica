'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckIcon } from '@/components/icons';
import { type InquiryFormState, submitInquiry } from '@/lib/inquiry-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted';

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-5 py-2.5 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Sending…' : children}
    </button>
  );
}

export function InquiryForm({ type }: { type: 'advertise' | 'contact' }) {
  const [state, action] = useActionState<InquiryFormState, FormData>(submitInquiry, {});

  if (state.success) {
    return (
      <div className="rounded-2xl border border-accent-green/40 bg-accent-green/10 p-6">
        <p className="flex items-center gap-2 font-heading text-lg font-bold text-text">
          <CheckIcon size={18} className="text-accent-green" /> Thanks — we’ve got it.
        </p>
        <p className="mt-1 font-body text-sm text-muted">
          Our team will review your {type === 'advertise' ? 'advertising enquiry' : 'message'} and
          get back to you by email.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-6">
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>Your name</span>
          <input name="name" required minLength={2} maxLength={120} className={field} />
        </label>
        <label>
          <span className={label}>Email</span>
          <input name="email" type="email" required maxLength={200} className={field} />
        </label>
        {type === 'advertise' ? (
          <>
            <label>
              <span className={label}>Company</span>
              <input name="company" maxLength={160} className={field} />
            </label>
            <label>
              <span className={label}>Placement of interest</span>
              <select name="placement" defaultValue="" className={field}>
                <option value="">Not sure yet</option>
                <option value="leaderboard">Leaderboard</option>
                <option value="billboard">Billboard</option>
                <option value="rectangle">Rectangle</option>
                <option value="halfpage">Half page</option>
                <option value="native">Native / in-feed</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Estimated budget (optional)</span>
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
            <span className={label}>Subject</span>
            <input name="subject" maxLength={160} className={field} />
          </label>
        )}
        <label className="sm:col-span-2">
          <span className={label}>Message</span>
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
        <SubmitButton>{type === 'advertise' ? 'Send enquiry' : 'Send message'}</SubmitButton>
      </div>
    </form>
  );
}
