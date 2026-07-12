'use client';

import { useMemo, useState, useTransition } from 'react';
import { MegaphoneIcon, MailIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import type { InquiryItem, InquiryStatus } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/lib/i18n';
import { setInquiryStatus } from '@/lib/inquiry-actions';

const TABS: { key: string; labelKey: MessageKey; match: (i: InquiryItem) => boolean }[] = [
  { key: 'all', labelKey: 'dinq.all', match: () => true },
  { key: 'new', labelKey: 'dinq.new', match: (i) => i.status === 'new' },
  { key: 'advertise', labelKey: 'dinq.advertising', match: (i) => i.type === 'advertise' },
  { key: 'contact', labelKey: 'dinq.contact', match: (i) => i.type === 'contact' },
  { key: 'closed', labelKey: 'dinq.closed', match: (i) => i.status === 'closed' },
];

const STATUS_STEPS: { value: InquiryStatus; labelKey: MessageKey }[] = [
  { value: 'new', labelKey: 'dinq.new' },
  { value: 'in_progress', labelKey: 'dinq.inProgress' },
  { value: 'closed', labelKey: 'dinq.closed' },
];

const STATUS_KEY: Record<InquiryStatus, MessageKey> = {
  new: 'dinq.new',
  in_progress: 'dinq.inProgress',
  closed: 'dinq.closed',
};

function StatusPill({ status }: { status: InquiryStatus }) {
  const t = useT();
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
      {t(STATUS_KEY[status])}
    </span>
  );
}

function InquiryCard({ item }: { item: InquiryItem }) {
  const t = useT();
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
          {item.type === 'advertise' ? t('dinq.advertising') : t('dinq.contact')}
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
              {t('dinq.subject')}: <span className="text-text">{item.subject}</span>
            </span>
          )}
          {item.placement && (
            <span>
              {t('dinq.placement')}: <span className="text-text">{item.placement}</span>
            </span>
          )}
          {item.budget && (
            <span>
              {t('dinq.budget')}: <span className="text-text">{item.budget}</span>
            </span>
          )}
        </div>
      )}

      <p className="mt-2 whitespace-pre-wrap font-body text-sm text-text">{item.message}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wide text-faint">
          {t('dinq.set')}
        </span>
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
            {t(s.labelKey)}
          </button>
        ))}
      </div>
    </li>
  );
}

export function InquiriesAdmin({ inquiries }: { inquiries: InquiryItem[] }) {
  const t = useT();
  const [tab, setTab] = useState('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const tabItem of TABS) c[tabItem.key] = inquiries.filter(tabItem.match).length;
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
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">
          {t('dash.inquiries')}
        </h1>
      </div>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t('dinq.subtitle')} {inquiries.length} {t('dinq.workThrough')}
      </p>

      <div className="mt-5 flex flex-wrap gap-1">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === tabItem.key
                ? 'bg-primary/12 text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-text'
            }`}
          >
            {t(tabItem.labelKey)}
            <span
              className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                tab === tabItem.key ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-faint'
              }`}
            >
              {counts[tabItem.key]}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">{t('dinq.nothingHere')}</p>
          <p className="mt-1 font-body text-sm text-muted">{t('dinq.nothingBody')}</p>
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
