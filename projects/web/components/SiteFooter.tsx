import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { type MessageKey, t, translateCategory } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Wordmark } from './Wordmark';

const COLUMNS: { titleKey: MessageKey; items: { key: MessageKey; href: string }[] }[] = [
  {
    titleKey: 'footer.company',
    items: [
      { key: 'footer.aboutUs', href: '/about' },
      { key: 'footer.advertise', href: '/advertise' },
      { key: 'footer.contact', href: '/contact' },
      { key: 'footer.sendTip', href: '/tips' },
    ],
  },
  {
    titleKey: 'footer.read',
    items: [
      { key: 'footer.latest', href: '/' },
      { key: 'nav.forYou', href: '/for-you' },
      { key: 'mm.videos', href: '/videos' },
      { key: 'mm.galleries', href: '/galleries' },
      { key: 'mm.podcasts', href: '/podcasts' },
      { key: 'mm.interactives', href: '/interactives' },
      { key: 'footer.search', href: '/search' },
    ],
  },
  {
    titleKey: 'footer.legal',
    items: [
      { key: 'footer.privacy', href: '/privacy' },
      { key: 'footer.terms', href: '/terms' },
      { key: 'footer.standards', href: '/standards' },
      { key: 'footer.corrections', href: '/corrections' },
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
    <footer className="site-footer">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <Wordmark />
        <p className="mt-3 max-w-sm font-body text-sm text-muted">{t(locale, 'footer.tagline')}</p>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <ColumnHeading>{t(locale, 'nav.sections')}</ColumnHeading>
            <ul className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`/section/${section.slug}`}
                    className="font-body text-sm text-muted hover:text-primary"
                  >
                    {translateCategory(locale, section.slug, section.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.titleKey}>
              <ColumnHeading>{t(locale, column.titleKey)}</ColumnHeading>
              <ul className="mt-3 flex flex-col gap-2">
                {column.items.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="font-body text-sm text-muted hover:text-primary"
                    >
                      {t(locale, item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Frame Africa {t(locale, 'footer.rights')}
          </p>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.14em]">{t(locale, 'footer.language')}</span>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
