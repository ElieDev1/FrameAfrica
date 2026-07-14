'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { useT } from '@/components/LocaleProvider';
import { cancelSubscriptionAction } from '@/lib/billing-actions';

/** Cancel the renewal — the reader keeps access to the end of the paid period. */
export function CancelSubscription({ periodEnd }: { periodEnd: string }) {
  const t = useT();
  const ask = useConfirm();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function cancel() {
    const ok = await ask({
      title: t('pay.cancelTitle'),
      message: `${t('pay.cancelConfirm')} ${new Date(periodEnd).toLocaleDateString()}.`,
      confirmLabel: t('pay.cancelConfirmBtn'),
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await cancelSubscriptionAction();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
      >
        {t('pay.cancel')}
      </button>
      {error && <p className="mt-2 font-mono text-xs text-accent-red">{error}</p>}
    </div>
  );
}
