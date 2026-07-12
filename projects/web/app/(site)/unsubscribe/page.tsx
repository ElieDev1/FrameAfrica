import type { Metadata } from 'next';
import { UnsubscribeConfirm } from '@/components/UnsubscribeConfirm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale, 'nl.newsletter')} — Frame Africa`,
    robots: { index: false },
  };
}

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const token = ((await searchParams).token ?? '').trim();
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'nl.newsletter')}
      </h1>
      <div className="mt-6">
        {token ? (
          <UnsubscribeConfirm token={token} />
        ) : (
          <p className="font-body text-muted">{t(locale, 'nl.missingToken')}</p>
        )}
      </div>
    </div>
  );
}
