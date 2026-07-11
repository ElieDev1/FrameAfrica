import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Wordmark } from './Wordmark';

const COLUMNS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: 'Company',
    items: [
      { label: 'About us', href: '/about' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Contact', href: '/contact' },
      { label: 'Send a tip', href: '/tips' },
    ],
  },
  {
    title: 'Read',
    items: [
      { label: 'Latest', href: '/' },
      { label: 'For you', href: '/for-you' },
      { label: 'Videos', href: '/videos' },
      { label: 'Galleries', href: '/galleries' },
      { label: 'Search', href: '/search' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Editorial standards', href: '/standards' },
      { label: 'Corrections', href: '/corrections' },
    ],
  },
];

function ColumnHeading({ children }: { children: string }) {
  return (
    <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text">
      {children}
    </h3>
  );
}

export async function SiteFooter() {
  const locale = await getLocale();
  let sections: CategoryNode[] = [];
  try {
    sections = (await fetchCategories()).slice(0, 5);
  } catch {
    sections = [];
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <Wordmark />
        <p className="mt-3 max-w-sm font-body text-sm text-muted">{t(locale, 'footer.tagline')}</p>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <ColumnHeading>Sections</ColumnHeading>
            <ul className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`/section/${section.slug}`}
                    className="font-body text-sm text-muted hover:text-primary"
                  >
                    {section.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <ColumnHeading>{column.title}</ColumnHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="font-body text-sm text-muted hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Frame Africa Media Ltd · Kigali, Rwanda</p>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.14em]">{t(locale, 'footer.language')}</span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
