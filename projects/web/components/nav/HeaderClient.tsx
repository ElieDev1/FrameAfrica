'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CategoryNode } from '@/lib/api';
import { type Locale, type MessageKey, t, translateCategory } from '@/lib/i18n';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from '../icons';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { Wordmark } from '../Wordmark';
import { MobileMenu } from './MobileMenu';
import { ProfileMenu } from './ProfileMenu';

export interface NavUser {
  firstName: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isStaff: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  /** An active subscription — drives the member badge on the avatar. */
  isSubscriber: boolean;
}

export interface FeaturedStory {
  title: string;
  slug: string;
  imageUrl: string | null;
}
export type FeaturedMap = Record<string, FeaturedStory>;

interface Props {
  sections: CategoryNode[];
  allSections: CategoryNode[];
  featured: FeaturedMap;
  user: NavUser | null;
  locale: Locale;
}

function shortLabel(name: string): string {
  return name.split(' & ')[0];
}

/** Standalone multimedia hub pages, surfaced under the Multimedia nav dropdown. */
const MULTIMEDIA_HUBS: { nameKey: MessageKey; href: string }[] = [
  { nameKey: 'mm.videos', href: '/videos' },
  { nameKey: 'mm.galleries', href: '/galleries' },
  { nameKey: 'mm.podcasts', href: '/podcasts' },
  { nameKey: 'mm.interactives', href: '/interactives' },
];

/** The taxonomy "Multimedia" section also links to the hub pages above. */
function isMultimedia(slug: string): boolean {
  return slug === 'multimedia';
}
function hasMenu(section: CategoryNode): boolean {
  return section.children.length > 0 || isMultimedia(section.slug);
}

export function HeaderClient({ sections, allSections, featured, user, locale }: Props) {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);

  // Condense the masthead once the reader scrolls past the hero fold.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCondensed(window.scrollY > 72));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const isActive = (slug: string) =>
    pathname === `/section/${slug}` || pathname.startsWith(`/section/${slug}/`);

  // A top section is "active" if the current section is it or one of its children.
  const sectionActive = (section: CategoryNode) =>
    isActive(section.slug) || section.children.some((c) => isActive(c.slug));

  return (
    <header
      className={`sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl transition-shadow ${
        condensed ? 'shadow-sm' : ''
      }`}
    >
      {/* Row 1 — brand + actions. The section nav gets its own row below, the
          way a newspaper masthead runs: cramming brand + nine sections + the
          actions cluster into one row needed ~1390px and scrolled the page
          sideways on any laptop. */}
      <div
        className={`mx-auto flex max-w-[1440px] items-center gap-2 px-3 transition-[padding] duration-300 sm:gap-3 sm:px-6 ${
          condensed ? 'py-2' : 'py-3'
        }`}
      >
        {/* Brand */}
        <div className="flex min-w-0 shrink items-center gap-2">
          <div className="flex items-center lg:hidden">
            <MobileMenu
              sections={allSections}
              signedIn={Boolean(user)}
              isStaff={user?.isStaff ?? false}
              isEditor={user?.isEditor ?? false}
              isAdmin={user?.isAdmin ?? false}
              firstName={user?.firstName ?? null}
              locale={locale}
            />
          </div>
          <Link href="/" aria-label="Frame Africa — home" className="min-w-0 shrink">
            <Wordmark />
          </Link>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* An international, trilingual site keeps its language choice in the
              masthead — not buried in the footer. */}
          <span className="hidden font-mono text-[11px] md:inline-flex">
            <LanguageSwitcher current={locale} />
          </span>
          <SearchForm locale={locale} />
          <Link
            href="/search"
            aria-label={t(locale, 'nav.searchAria')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-primary lg:hidden"
          >
            <SearchIcon size={16} />
          </Link>
          <ThemeToggle />
          {user ? (
            <ProfileMenu user={user} locale={locale} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden whitespace-nowrap text-[13px] font-medium text-muted transition-colors hover:text-primary sm:inline"
              >
                {t(locale, 'nav.signIn')}
              </Link>
              {/* "Subscribe" now means subscribe — it used to just open signup. */}
              <Link
                href="/pricing"
                className="whitespace-nowrap rounded-full bg-primary px-2.5 py-1.5 text-[13px] font-semibold text-black transition-transform hover:-translate-y-px sm:px-3"
              >
                {t(locale, 'nav.subscribe')}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — the section bar. Full width to itself, so it always fits; it
          folds away once the reader scrolls, keeping the sticky bar slim. */}
      {sections.length > 0 && !condensed && (
        <div className="hidden border-t border-border lg:block">
          <nav aria-label="Sections" className="mx-auto max-w-[1440px] px-6">
            <ul className="flex items-center">
              {sections.map((section, index) => {
                const active = sectionActive(section);
                const feat = featured[section.slug];
                // The last few menus are anchored to their right edge, or a
                // 36rem panel hanging off the final section would run off-screen.
                const alignRight = index >= sections.length - 3;
                return (
                  <li key={section.id} className="group relative">
                    <Link
                      href={`/section/${section.slug}`}
                      aria-current={active ? 'page' : undefined}
                      className={`relative inline-flex items-center gap-0.5 px-2 py-2.5 text-[13px] font-semibold transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:transition-transform after:duration-200 group-hover:text-text group-focus-within:text-text group-hover:after:scale-x-100 group-focus-within:after:scale-x-100 ${
                        active ? 'text-text after:scale-x-100' : 'text-muted after:scale-x-0'
                      }`}
                    >
                      {shortLabel(translateCategory(locale, section.slug, section.name))}
                      {hasMenu(section) && (
                        <ChevronDownIcon
                          size={12}
                          aria-hidden
                          className="opacity-60 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                        />
                      )}
                    </Link>

                    {hasMenu(section) && (
                      <MegaMenu
                        section={section}
                        featured={feat}
                        activeSlug={pathname}
                        locale={locale}
                        alignRight={alignRight}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchForm({ locale }: { locale: Locale }) {
  return (
    <form action="/search" className="relative hidden lg:block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
        <SearchIcon size={15} />
      </span>
      <input
        name="q"
        type="search"
        placeholder={t(locale, 'nav.searchPlaceholder')}
        aria-label={t(locale, 'nav.searchAria')}
        className="w-36 rounded-full border border-border bg-surface-2 py-1.5 pl-9 pr-4 text-sm text-text outline-none transition-[width,border-color] focus:w-52 focus:border-primary xl:w-44"
      />
    </form>
  );
}

function MegaMenu({
  section,
  featured,
  activeSlug,
  locale,
  alignRight = false,
}: {
  section: CategoryNode;
  featured?: FeaturedStory;
  activeSlug: string;
  locale: Locale;
  /** Anchor the panel to its right edge — for sections near the end of the bar. */
  alignRight?: boolean;
}) {
  const wide = Boolean(featured);
  return (
    <div
      className={`invisible absolute top-full z-30 translate-y-1 rounded-2xl border border-border bg-surface/95 p-3 opacity-0 shadow-2xl backdrop-blur-xl transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
        alignRight ? 'right-0' : 'left-0'
      } ${wide ? 'w-[36rem]' : 'w-max min-w-[15rem] max-w-[34rem]'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-8 border-b border-border pb-2">
        <span className="font-heading text-sm font-bold text-text">
          {translateCategory(locale, section.slug, section.name)}
        </span>
        <Link
          href={`/section/${section.slug}`}
          className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary hover:underline"
        >
          {t(locale, 'common.viewAll')}
          <ChevronRightIcon size={12} aria-hidden />
        </Link>
      </div>

      <div className={wide ? 'grid grid-cols-[1fr_13rem] gap-4' : ''}>
        <div
          className={
            section.children.length > 5
              ? 'grid grid-cols-2 gap-x-6 gap-y-0.5'
              : 'grid grid-cols-1 gap-y-0.5'
          }
        >
          {isMultimedia(section.slug) &&
            MULTIMEDIA_HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-surface-2 hover:text-primary ${
                  activeSlug === hub.href ? 'text-primary' : 'text-text'
                }`}
              >
                {t(locale, hub.nameKey)}
              </Link>
            ))}
          {!isMultimedia(section.slug) &&
            section.children.map((child) => {
              const active = activeSlug === `/section/${child.slug}`;
              return (
                <Link
                  key={child.id}
                  href={`/section/${child.slug}`}
                  className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-primary ${
                    active ? 'text-primary' : 'text-muted'
                  }`}
                >
                  {translateCategory(locale, child.slug, child.name)}
                </Link>
              );
            })}
        </div>

        {featured && (
          <Link href={`/article/${featured.slug}`} className="group/feat block">
            <span className="relative block aspect-[16/10] overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border">
              {featured.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- article image, arbitrary host
                <img src={featured.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="media-fill absolute inset-0" />
              )}
              <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                {t(locale, 'home.latest')}
              </span>
            </span>
            <span className="mt-1.5 line-clamp-2 font-heading text-sm font-bold leading-snug text-text group-hover/feat:text-primary">
              {featured.title}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
