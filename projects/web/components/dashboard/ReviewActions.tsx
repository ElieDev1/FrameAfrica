'use client';

import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { useT } from '@/components/LocaleProvider';
import { Modal } from '@/components/Modal';
import { publishAction, rejectAction, scheduleAction } from '@/lib/cms-actions';

/**
 * The review queue's decisions. These used to be three forms sitting inline on
 * every row — a bare "Publish" with no confirmation, a date field and a note
 * box — which made the queue hard to scan. Now each row is three buttons:
 * publishing asks first (it goes live immediately), and scheduling and
 * returning open a modal with just the field they need.
 */
export function ReviewActions({ id, title }: { id: string; title: string }) {
  const t = useT();
  const ask = useConfirm();
  const [modal, setModal] = useState<'schedule' | 'return' | null>(null);
  const [pending, start] = useTransition();

  async function publish() {
    const ok = await ask({
      title: t('drev.publish'),
      message: `“${title}” — ${t('drev.publishConfirm')}`,
      confirmLabel: t('drev.publish'),
    });
    if (!ok) return;
    start(() => {
      void publishAction(id);
    });
  }

  const btn =
    'rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={publish}
        disabled={pending}
        className={`${btn} bg-primary text-black hover:opacity-90`}
      >
        {t('drev.publish')}
      </button>
      <button
        type="button"
        onClick={() => setModal('schedule')}
        disabled={pending}
        className={`${btn} border border-primary text-primary hover:bg-primary hover:text-black`}
      >
        {t('drev.schedule')}
      </button>
      <button
        type="button"
        onClick={() => setModal('return')}
        disabled={pending}
        className={`${btn} border border-accent-red text-accent-red hover:bg-accent-red hover:text-white`}
      >
        {t('drev.return')}
      </button>

      {modal === 'schedule' && (
        <Modal title={t('drev.scheduleTitle')} onClose={() => setModal(null)}>
          <form action={scheduleAction.bind(null, id)} className="flex flex-col gap-3">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {t('drev.scheduleWhen')}
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary"
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
              >
                {t('d.common.cancel')}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90"
              >
                {t('drev.schedule')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'return' && (
        <Modal title={t('drev.returnTitle')} onClose={() => setModal(null)}>
          <form action={rejectAction.bind(null, id)} className="flex flex-col gap-3">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {t('drev.returnNote')}
            </label>
            <textarea
              name="note"
              rows={4}
              maxLength={1000}
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
              >
                {t('d.common.cancel')}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-accent-red px-3 py-1.5 font-heading text-xs font-bold text-white hover:opacity-90"
              >
                {t('drev.return')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
