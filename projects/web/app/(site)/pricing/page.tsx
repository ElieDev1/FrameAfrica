import type { Metadata } from 'next';
import Link from 'next/link';
import { PlanPicker } from '@/components/billing/PlanPicker';
import { CheckIcon } from '@/components/icons';
import { fetchMySubscription, fetchPlans } from '@/lib/billing';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Subscribe',
  description:
    'Support independent African journalism — unlimited access to every Frame Africa story.',
  alternates: { canonical: '/pricing' },
  openGraph: { type: 'website', url: absoluteUrl('/pricing') },
};

const BENEFIT_KEYS = ['pay.benefit1', 'pay.benefit2', 'pay.benefit3', 'pay.benefit4'] as const;

export default async function PricingPage() {
  const [plans, subscription, locale] = await Promise.all([
    fetchPlans(),
    fetchMySubscription(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          {t(locale, 'pay.kicker')}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
          {t(locale, 'pay.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-body text-muted">{t(locale, 'pay.subtitle')}</p>
      </header>

      {/* Already a subscriber — don't sell them what they have. */}
      {subscription?.isActive ? (
        <div className="mt-10 rounded-xl border border-accent-green/40 bg-accent-green/5 p-8 text-center">
          <p className="font-heading text-xl font-bold text-text">
            {t(locale, 'pay.alreadyTitle')}
          </p>
          <p className="mt-2 font-body text-muted">
            {t(locale, 'pay.alreadyBody')}{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
          </p>
          <Link
            href="/account/billing"
            className="mt-5 inline-block rounded-lg border border-border px-4 py-2 font-heading text-sm font-bold text-text transition hover:border-primary hover:text-primary"
          >
            {t(locale, 'pay.manage')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 font-body text-sm text-muted">
                <CheckIcon size={16} className="mt-0.5 shrink-0 text-primary" />
                {t(locale, key)}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <PlanPicker plans={plans} />
          </div>

          <p className="mt-8 text-center font-body text-xs text-faint">
            {t(locale, 'pay.cardNote')}
          </p>
        </>
      )}
    </div>
  );
}
