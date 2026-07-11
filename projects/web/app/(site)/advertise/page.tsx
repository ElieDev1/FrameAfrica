import type { Metadata } from 'next';
import { InquiryForm } from '@/components/InquiryForm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale, 'footer.advertise')} — Frame Africa`,
    description: t(locale, 'inquiry.advertiseSubtitle'),
  };
}

export default async function AdvertisePage() {
  const locale = await getLocale();

  const reasons = [
    [t(locale, 'inquiry.reasonTitle1'), t(locale, 'inquiry.reasonBody1')],
    [t(locale, 'inquiry.reasonTitle2'), t(locale, 'inquiry.reasonBody2')],
    [t(locale, 'inquiry.reasonTitle3'), t(locale, 'inquiry.reasonBody3')],
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
        {t(locale, 'footer.advertise')}
      </p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
        {t(locale, 'inquiry.advertiseTitle')}
      </h1>
      <p className="mt-3 max-w-xl font-body text-lg leading-relaxed text-muted">
        {t(locale, 'inquiry.advertiseSubtitle')}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {reasons.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border bg-surface p-4">
            <p className="font-heading text-sm font-bold text-text">{title}</p>
            <p className="mt-1 font-body text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <InquiryForm type="advertise" />
      </div>
    </div>
  );
}
