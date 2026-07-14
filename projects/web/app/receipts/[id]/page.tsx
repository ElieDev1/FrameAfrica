import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import logoLight from '@/public/brand/logo-light.png';
import { DownloadReceipt } from '@/components/billing/DownloadReceipt';
import { fetchReceipt, formatMoney } from '@/lib/billing';
import { formatDate } from '@/lib/format';
import { t, type MessageKey } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { getSession } from '@/lib/session';

// `absolute` bypasses the site title template, so the browser's print header
// reads "Frame Africa Receipt", not "Receipt — Frame Africa — Frame Africa".
export const metadata: Metadata = { title: { absolute: 'Frame Africa Receipt' } };

type PageProps = { params: Promise<{ id: string }> };

const PROVIDER_LABEL: Record<string, MessageKey> = {
  momo: 'pay.momo',
  airtel: 'pay.airtel',
  stripe: 'pay.card',
  manual: 'pay.method',
};

/**
 * A subscription receipt, on its own chrome-free page (no site header, footer or
 * ticker) so it prints as a single clean document — a white "paper" sheet that
 * reads the same on screen and on paper.
 */
export default async function ReceiptPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) redirect('/login?next=/account/billing');

  const { id } = await params;
  const [receipt, locale] = await Promise.all([fetchReceipt(id), getLocale()]);
  if (!receipt) notFound();

  const providerLabel = t(locale, PROVIDER_LABEL[receipt.provider] ?? 'pay.method');
  const intervalLabel =
    receipt.plan.interval === 'year' ? t(locale, 'pay.year') : t(locale, 'pay.month');
  const amount = formatMoney(receipt.amountCents, receipt.currency, locale);

  return (
    <div className="min-h-screen bg-bg px-6 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl print:max-w-none">
        {/* The receipt sheet — white paper, so the dark-ink logo always shows. */}
        <article
          data-print-sheet
          className="rounded-2xl border border-black/10 bg-white p-8 text-neutral-800 shadow-sm sm:p-10"
        >
          {/* Header: real logo + PAID */}
          <header className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
            <Image
              src={logoLight}
              alt="Frame Africa"
              height={40}
              width={Math.round((40 * 800) / 240)}
              className="h-10 w-auto"
              priority
            />
            <div className="text-right">
              <span className="inline-block rounded-md border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                {t(locale, 'pay.paid')}
              </span>
              <p className="mt-2 font-mono text-[11px] text-neutral-500">
                {t(locale, 'pay.receiptNo')} {receipt.number}
              </p>
              <p className="font-mono text-[11px] text-neutral-400">
                {formatDate(receipt.issuedAt, locale)}
              </p>
            </div>
          </header>

          {/* Billed to + method */}
          <section className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                {t(locale, 'pay.billedTo')}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{receipt.billedTo.name}</p>
              <p className="text-sm text-neutral-500">{receipt.billedTo.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                {t(locale, 'pay.method')}
              </p>
              <p className="mt-1 text-sm text-neutral-900">{providerLabel}</p>
              {receipt.reference && (
                <p className="font-mono text-[11px] text-neutral-500">{receipt.reference}</p>
              )}
            </div>
          </section>

          {/* Line item */}
          <section className="border-y border-black/10">
            <table className="w-full text-left">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                  <th className="py-2 font-medium">{t(locale, 'pay.description')}</th>
                  <th className="py-2 text-right font-medium">{t(locale, 'pay.amount')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-black/10 align-top">
                  <td className="py-3">
                    <p className="text-sm font-semibold text-neutral-900">{receipt.plan.name}</p>
                    <p className="text-xs text-neutral-500">
                      {t(locale, 'pay.oneInterval').replace('{interval}', intervalLabel)}
                    </p>
                    {receipt.period && (
                      <p className="mt-1 font-mono text-[11px] text-neutral-400">
                        {t(locale, 'pay.covers')} {formatDate(receipt.period.start, locale)}
                        {' · '}
                        {formatDate(receipt.period.end, locale)}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-neutral-900">{amount}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Total */}
          <section className="flex items-center justify-between py-5">
            <span className="font-heading text-sm font-bold uppercase tracking-[0.1em] text-neutral-500">
              {t(locale, 'pay.totalPaid')}
            </span>
            <span className="font-heading text-2xl font-black text-neutral-900">{amount}</span>
          </section>

          {/* Barcode of the receipt number */}
          <section className="flex flex-col items-center border-t border-black/10 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- inline data: barcode, no host */}
            <img
              src={receipt.barcodeDataUrl}
              alt={receipt.number}
              className="h-12 w-auto max-w-full"
            />
            <span className="mt-1 font-mono text-[11px] tracking-[0.2em] text-neutral-500">
              {receipt.number}
            </span>
          </section>

          {/* QR + verification */}
          <footer className="flex items-center gap-5 border-t border-black/10 pt-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- inline data: QR, no host */}
            <img
              src={receipt.qrDataUrl}
              alt={t(locale, 'pay.scanToVerify')}
              width={96}
              height={96}
              className="h-24 w-24 shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">
                {t(locale, 'pay.scanToVerify')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {t(locale, 'pay.receiptFooter')}
              </p>
            </div>
          </footer>
        </article>

        {/* Actions — below the sheet, and never printed. */}
        <div className="no-print mt-6 flex items-center justify-center gap-3">
          <DownloadReceipt label={t(locale, 'pay.downloadReceipt')} />
          <Link
            href="/account/billing"
            className="rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted transition hover:border-primary hover:text-primary"
          >
            {t(locale, 'pay.billing')}
          </Link>
        </div>
      </div>
    </div>
  );
}
