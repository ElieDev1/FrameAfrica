import type { Metadata } from 'next';
import Link from 'next/link';
import { InquiryForm } from '@/components/InquiryForm';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale, 'footer.contact')} — Frame Africa`,
    description: t(locale, 'inquiry.contactSubtitle'),
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const subtitle = t(locale, 'inquiry.contactSubtitle');
  const linkText = t(locale, 'inquiry.secureTipsLink');
  const parts = subtitle.split(linkText);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
        {t(locale, 'footer.contact')}
      </p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
        {t(locale, 'inquiry.contactTitle')}
      </h1>
      <p className="mt-3 max-w-xl font-body text-lg leading-relaxed text-muted">
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <Link href="/tips" className="text-primary hover:underline">
              {linkText}
            </Link>
            {parts[1]}
          </>
        ) : (
          subtitle
        )}
      </p>

      <div className="mt-8">
        <InquiryForm type="contact" />
      </div>
    </div>
  );
}
