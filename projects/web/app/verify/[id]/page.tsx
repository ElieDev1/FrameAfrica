import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { Wordmark } from '@/components/Wordmark';
import { fetchVerification, formatMoney } from '@/lib/billing';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: { absolute: 'Verify receipt — Frame Africa' },
  robots: { index: false }, // a per-receipt token URL shouldn't be indexed
};

type PageProps = { params: Promise<{ id: string }> };

/**
 * Public receipt verification — no sign-in. This is where a receipt's QR leads,
 * so anyone (a shop, an accountant, an event door) can confirm a payment is
 * genuine without being given the private receipt. It shows only what proves the
 * payment: the amount, date, plan and the payer's name — never their email, the
 * gateway reference, or the billing history.
 */
export default async function VerifyPage({ params }: PageProps) {
  const { id } = await params;
  const [verification, locale] = await Promise.all([fetchVerification(id), getLocale()]);

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 py-10">
      <div className="w-full max-w-md">
        {verification?.valid ? (
          <div className="overflow-hidden rounded-2xl border border-accent-green/30 bg-surface">
            {/* Logo + title, inside the card. */}
            <div className="flex flex-col items-center gap-2 px-6 pt-7 text-center">
              <Wordmark />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {t(locale, 'verify.title')}
              </p>
            </div>

            {/* Verified banner — green on success. */}
            <div className="mt-5 flex flex-col items-center gap-2 border-y border-accent-green/20 bg-accent-green/10 px-6 py-7 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-green text-white">
                <CheckIcon size={28} />
              </span>
              <p className="font-heading text-lg font-bold text-text">
                {t(locale, 'verify.genuine')}
              </p>
              <p className="font-body text-sm text-muted">{t(locale, 'verify.genuineBody')}</p>
            </div>

            {/* The proof */}
            <dl className="divide-y divide-border px-6 pb-3">
              <Row label={t(locale, 'pay.receiptNo')} value={verification.number} />
              <Row
                label={t(locale, 'pay.amount')}
                value={formatMoney(verification.amountCents, verification.currency, locale)}
                strong
              />
              <Row
                label={t(locale, 'pay.date')}
                value={formatDate(verification.issuedAt, locale)}
              />
              <Row label={t(locale, 'pay.plan')} value={verification.planName} />
              <Row label={t(locale, 'pay.billedTo')} value={verification.payerName} />
            </dl>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <div className="mb-6 flex flex-col items-center gap-2">
              <Wordmark />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {t(locale, 'verify.title')}
              </p>
            </div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-red/15 text-accent-red">
              <CloseIcon size={26} />
            </span>
            <p className="mt-4 font-heading text-lg font-bold text-text">
              {t(locale, 'verify.notFound')}
            </p>
            <p className="mt-1 font-body text-sm text-muted">{t(locale, 'verify.notFoundBody')}</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted transition hover:border-primary hover:text-primary"
            >
              {t(locale, 'nav.home')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd
        className={`text-right font-body text-sm ${strong ? 'font-bold text-text' : 'text-muted'}`}
      >
        {value}
      </dd>
    </div>
  );
}
