import type { Metadata } from 'next';
import { SecureTipForm } from '@/components/SecureTipForm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale, 'tips.title')} — Frame Africa`,
    description: t(locale, 'tips.subtitle'),
  };
}

export default async function TipsPage() {
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
        {t(locale, 'tips.trustSafety')}
      </p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
        {t(locale, 'tips.title')}
      </h1>
      <p className="mt-3 font-body text-muted">{t(locale, 'tips.body')}</p>

      <ul className="mt-6 space-y-2 border-y border-border py-5 font-body text-sm text-muted">
        <li>• {t(locale, 'tips.bullet1')}</li>
        <li>• {t(locale, 'tips.bullet2')}</li>
        <li>• {t(locale, 'tips.bullet3')}</li>
      </ul>

      <div className="mt-6">
        <SecureTipForm />
      </div>
    </div>
  );
}
