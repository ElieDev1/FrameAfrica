'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { MailIcon, UsersIcon } from '@/components/icons';
import type { NewsletterCampaignItem } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { type SendState, sendCampaign } from '@/lib/newsletter-admin-actions';

const field =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

function SendButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="rounded-lg bg-primary px-5 py-2.5 font-heading font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Sending…' : `Send to ${count} subscriber${count === 1 ? '' : 's'}`}
    </button>
  );
}

export function NewsletterAdmin({
  count,
  campaigns,
}: {
  count: number;
  campaigns: NewsletterCampaignItem[];
}) {
  const [state, action] = useActionState<SendState, FormData>(sendCampaign, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sent !== undefined) formRef.current?.reset();
  }, [state.sent]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <MailIcon size={20} className="text-primary" />
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Newsletter</h1>
      </div>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Compose and send an update to your subscribers.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        {/* Composer */}
        <form
          ref={formRef}
          action={action}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Compose</h2>
          <div className="mt-3 flex flex-col gap-3">
            <label>
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                Subject
              </span>
              <input name="subject" required minLength={3} maxLength={160} className={field} />
            </label>
            <label>
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                Body
              </span>
              <textarea
                name="body"
                required
                minLength={10}
                maxLength={20000}
                rows={10}
                className={field}
              />
            </label>
          </div>

          {state.error && (
            <p role="alert" className="mt-3 font-mono text-xs text-accent-red">
              {state.error}
            </p>
          )}
          {state.sent !== undefined && (
            <p className="mt-3 font-mono text-xs text-accent-green">
              Sent — {state.sent} recipient{state.sent === 1 ? '' : 's'} recorded.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <SendButton count={count} />
            <p className="font-mono text-[10px] leading-relaxed text-faint">
              Delivery uses the configured mail worker; recipients are recorded here.
            </p>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15">
              <UsersIcon size={17} />
            </span>
            <div className="mt-3 font-heading text-3xl font-black text-text">{count}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Active subscribers
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Recent campaigns
            </h2>
            {campaigns.length === 0 ? (
              <p className="mt-3 font-body text-sm text-muted">None sent yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {campaigns.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <p className="truncate font-heading text-sm font-bold text-text">{c.subject}</p>
                    <p className="font-mono text-[11px] text-muted">
                      {c.recipients} recipients · {formatDate(c.sentAt ?? c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
