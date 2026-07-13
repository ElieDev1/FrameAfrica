import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { type MessageKey, t, translateCategory } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchPublicSiteSettings } from '@/lib/settings';
import type { SocialLink } from '@/lib/settings-types';
import { BrandIcon, MailIcon, PhoneIcon, type BrandName } from './icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NewsletterBox } from './NewsletterBox';
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

/** Settings key → the brand mark we draw for it. */
const BRAND_BY_KEY: Record<string, BrandName> = {
  SOCIAL_X_URL: 'x',
  SOCIAL_FACEBOOK_URL: 'facebook',
  SOCIAL_INSTAGRAM_URL: 'instagram',
  SOCIAL_YOUTUBE_URL: 'youtube',
  SOCIAL_LINKEDIN_URL: 'linkedin',
  SOCIAL_TIKTOK_URL: 'tiktok',
  SOCIAL_WHATSAPP_URL: 'whatsapp',
};

function ColumnHeading({ children }: { children: string }) {
  return (
    <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text">
      {children}
    </h3>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-block font-body text-sm text-muted transition-colors hover:text-primary"
    >
      {children}
    </Link>
  );
}

/** The configured social profiles. Renders nothing at all when none are set. */
function SocialRail({ links, label }: { links: SocialLink[]; label: string }) {
  if (links.length === 0) return null;
  return (
    <div>
      <ColumnHeading>{label}</ColumnHeading>
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const brand = BRAND_BY_KEY[link.key];
          if (!brand) return null;
          return (
            <li key={link.key}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={link.label}
                title={link.label}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                <BrandIcon name={brand} size={18} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const locale = await getLocale();

  // Both are best-effort: the footer must render even if the API is down.
  const [sections, site] = await Promise.all([
    fetchCategories()
      .then((all) => all.slice(0, 6))
      .catch((): CategoryNode[] => []),
    fetchPublicSiteSettings(),
  ]);

  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-[1440px] px-6 py-14">
        {/* Brand + newsletter */}
        <div className="grid gap-10 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-16">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-muted">
              {t(locale, 'footer.tagline')}
            </p>

            {(site.contactEmail || site.contactPhone) && (
              <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                {site.contactEmail && (
                  <li>
                    <a
                      href={`mailto:${site.contactEmail}`}
                      className="inline-flex items-center gap-2 font-body text-sm text-muted transition-colors hover:text-primary"
                    >
                      <MailIcon size={16} />
                      {site.contactEmail}
                    </a>
                  </li>
                )}
                {site.contactPhone && (
                  <li>
                    <a
                      href={`tel:${site.contactPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 font-body text-sm text-muted transition-colors hover:text-primary"
                    >
                      <PhoneIcon size={16} />
                      {site.contactPhone}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="lg:w-full lg:justify-self-end">
            <NewsletterBox />
          </div>
        </div>

        {/* Link columns + socials */}
        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <ColumnHeading>{t(locale, 'nav.sections')}</ColumnHeading>
            <ul className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <FooterLink href={`/section/${section.slug}`}>
                    {translateCategory(locale, section.slug, section.name)}
                  </FooterLink>
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
                    <FooterLink href={item.href}>{t(locale, item.key)}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <SocialRail links={site.social} label={t(locale, 'footer.follow')} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Frame Africa {t(locale, 'footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden uppercase tracking-[0.14em] sm:inline">
              {t(locale, 'footer.builtIn')}
            </span>
            <span className="flex items-center gap-2">
              <span className="uppercase tracking-[0.14em]">{t(locale, 'footer.language')}</span>
              <LanguageSwitcher current={locale} dropUp />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
