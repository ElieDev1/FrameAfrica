'use client';

import { useMemo, useState, useTransition } from 'react';
import { MegaphoneIcon, MailIcon } from '@/components/icons';
import type { InquiryItem, InquiryStatus } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { setInquiryStatus } from '@/lib/inquiry-actions';

const TABS: { key: string; label: string; match: (i: InquiryItem) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'new', label: 'New', match: (i) => i.status === 'new' },
  { key: 'advertise', label: 'Advertising', match: (i) => i.type === 'advertise' },
  { key: 'contact', label: 'Contact', match: (i) => i.type === 'contact' },
  { key: 'closed', label: 'Closed', match: (i) => i.status === 'closed' },
];

const STATUS_STEPS: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
];

function StatusPill({ status }: { status: InquiryStatus }) {
  const tone =
    status === 'new'
      ? 'border-primary/40 text-primary'
      : status === 'in_progress'
        ? 'border-accent-yellow/40 text-accent-yellow'
        : 'border-border text-faint';
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tone}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function InquiryCard({ item }: { item: InquiryItem }) {
  const [status, setStatus] = useState(item.status);
  const [pending, start] = useTransition();

  function move(next: InquiryStatus) {
    const prev = status;
    setStatus(next);
    start(async () => {
      const res = await setInquiryStatus(item.id, next);
      if (res.error) setStatus(prev);
    });
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
            item.type === 'advertise' ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted'
          }`}
        >
          {item.type === 'advertise' ? 'Advertising' : 'Contact'}
        </span>
        <StatusPill status={status} />
        <span className="ml-auto font-mono text-[11px] text-faint">
          {formatDate(item.createdAt)}
        </span>
      </div>

      <div className="mt-2">
        <p className="font-heading font-bold text-text">
          {item.name}
          {item.company && (
            <span className="font-body font-normal text-muted"> · {item.company}</span>
          )}
        </p>
        <a
          href={`mailto:${item.email}`}
          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
        >
          <MailIcon size={12} /> {item.email}
        </a>
      </div>

      {(item.subject || item.placement || item.budget) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          {item.subject && (
            <span>
              Subject: <span className="text-text">{item.subject}</span>
            </span>
          )}
          {item.placement && (
            <span>
              Placement: <span className="text-text">{item.placement}</span>
            </span>
          )}
          {item.budget && (
            <span>
              Budget: <span className="text-text">{item.budget}</span>
            </span>
          )}
        </div>
      )}

      <p className="mt-2 whitespace-pre-wrap font-body text-sm text-text">{item.message}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wide text-faint">Set</span>
        {STATUS_STEPS.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={pending || status === s.value}
            onClick={() => move(s.value)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
              status === s.value
                ? 'border-primary bg-primary/12 text-primary'
                : 'border-border text-muted hover:border-primary hover:text-primary'
            } disabled:opacity-60`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export function InquiriesAdmin({ inquiries }: { inquiries: InquiryItem[] }) {
  const [tab, setTab] = useState('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TABS) c[t.key] = inquiries.filter(t.match).length;
    return c;
  }, [inquiries]);

  const rows = useMemo(() => {
    const active = TABS.find((t) => t.key === tab) ?? TABS[0];
    return inquiries.filter(active.match);
  }, [inquiries, tab]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <MegaphoneIcon size={20} className="text-primary" />
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Inquiries</h1>
      </div>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        Advertising enquiries and contact messages from the site. {inquiries.length} total — work
        them through New → In progress → Closed.
      </p>

      <div className="mt-5 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-primary/12 text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-text'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                tab === t.key ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-faint'
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">Nothing here</p>
          <p className="mt-1 font-body text-sm text-muted">
            Inquiries from the Advertise and Contact forms will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 lg:grid-cols-2">
          {rows.map((item) => (
            <InquiryCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
