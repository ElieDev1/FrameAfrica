import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CancelSubscription } from '@/components/billing/CancelSubscription';
import { fetchMyPayments, fetchMySubscription, formatMoney } from '@/lib/billing';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Billing' };

const STATUS_TONE: Record<string, string> = {
  succeeded: 'text-accent-green',
  pending: 'text-primary',
  failed: 'text-accent-red',
  refunded: 'text-muted',
};

export default async function BillingPage() {
  const user = await getSession();
  if (!user) redirect('/login?next=/account/billing');

  const [subscription, payments, locale] = await Promise.all([
    fetchMySubscription(),
    fetchMyPayments(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'pay.billing')}
      </h1>

      {/* Current subscription */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-6">
        {subscription?.isActive ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-green">
                  {t(locale, 'pay.active')}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold text-text">
                  {subscription.plan.name}
                </h2>
                <p className="mt-1 font-body text-sm text-muted">
                  {formatMoney(subscription.plan.priceCents, subscription.plan.currency, locale)} /{' '}
                  {subscription.plan.interval === 'year'
                    ? t(locale, 'pay.year')
                    : t(locale, 'pay.month')}
                </p>
              </div>
              <CancelSubscription periodEnd={subscription.currentPeriodEnd} />
            </div>

            <p className="mt-4 border-t border-border pt-4 font-body text-sm text-muted">
              {subscription.cancelAtPeriodEnd
                ? `${t(locale, 'pay.endsOn')} ${formatDate(subscription.currentPeriodEnd, locale)}.`
                : `${t(locale, 'pay.renewsOn')} ${formatDate(subscription.currentPeriodEnd, locale)}.`}
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="font-heading text-lg font-bold text-text">{t(locale, 'pay.noneTitle')}</p>
            <p className="mt-1 font-body text-sm text-muted">{t(locale, 'pay.noneBody')}</p>
            <Link
              href="/pricing"
              className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition hover:opacity-90"
            >
              {t(locale, 'pay.seePlans')}
            </Link>
          </div>
        )}
      </section>

      {/* Receipts */}
      {payments.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-bold text-text">{t(locale, 'pay.receipts')}</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-4 py-2 font-medium">{t(locale, 'pay.date')}</th>
                  <th className="px-4 py-2 font-medium">{t(locale, 'pay.amount')}</th>
                  <th className="px-4 py-2 font-medium">{t(locale, 'pay.method')}</th>
                  <th className="px-4 py-2 font-medium">{t(locale, 'pay.status')}</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted">
                      {formatDate(p.paidAt ?? p.createdAt, locale)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-text">
                      {formatMoney(p.amountCents, p.currency, locale)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs uppercase text-muted">
                      {p.provider}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-mono text-xs uppercase ${STATUS_TONE[p.status] ?? 'text-muted'}`}
                    >
                      {p.status}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {/* A receipt only exists for a settled payment. */}
                      {p.status === 'succeeded' && (
                        <Link
                          href={`/receipts/${p.id}`}
                          className="font-mono text-[11px] text-primary transition hover:underline"
                        >
                          {t(locale, 'pay.receipt')}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
