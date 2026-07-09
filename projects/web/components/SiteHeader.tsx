import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { getSession } from '@/lib/session';
import { SearchIcon } from './icons';
import { DesktopSectionNav } from './nav/DesktopSectionNav';
import { MobileMenu } from './nav/MobileMenu';
import { StaffMenu } from './nav/StaffMenu';
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';

const MAX_SECTIONS = 9;
const STAFF_ROLES = ['journalist', 'editor', 'admin'];
const EDITOR_ROLES = ['editor', 'admin'];

const today = () =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

/** Public masthead: brand + search + account, then one centered section nav. */
export async function SiteHeader() {
  let allSections: CategoryNode[] = [];
  try {
    allSections = await fetchCategories();
  } catch {
    allSections = [];
  }
  const navSections = allSections.slice(0, MAX_SECTIONS);
  const user = await getSession();
  const isStaff = user?.roles.some((role) => STAFF_ROLES.includes(role)) ?? false;
  const isEditor = user?.roles.some((role) => EDITOR_ROLES.includes(role)) ?? false;
  const isAdmin = user?.roles.includes('admin') ?? false;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-xl">
      {/* Masthead: brand (left) · date (center) · search + account (right). */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-2 justify-self-start">
          <div className="flex items-center md:hidden">
            <MobileMenu
              sections={allSections}
              signedIn={Boolean(user)}
              isStaff={isStaff}
              isEditor={isEditor}
              isAdmin={isAdmin}
              firstName={user?.displayName.split(' ')[0] ?? null}
            />
          </div>
          <Link href="/" aria-label="Frame Africa — home" className="shrink-0">
            <Wordmark />
          </Link>
        </div>

        <span className="hidden justify-self-center font-mono text-[10px] uppercase tracking-[0.16em] text-faint md:block">
          {today()} · Kigali
        </span>

        <div className="flex items-center gap-3 justify-self-end">
          <form action="/search" className="relative hidden md:block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <SearchIcon size={15} />
            </span>
            <input
              name="q"
              type="search"
              placeholder="Search…"
              aria-label="Search articles"
              className="w-44 rounded-full border border-border bg-surface-2 py-1.5 pl-9 pr-4 font-body text-sm text-text outline-none transition-[width,border-color] focus:w-64 focus:border-primary"
            />
          </form>

          <ThemeToggle />

          {user ? (
            <>
              {isStaff && <StaffMenu isEditor={isEditor} isAdmin={isAdmin} />}
              <Link
                href="/account"
                className="hidden text-sm font-medium text-text transition-colors hover:text-primary md:inline"
              >
                {user.displayName.split(' ')[0]}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-muted transition-colors hover:text-primary md:inline"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-black transition-transform hover:-translate-y-px md:inline"
              >
                Subscribe
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Section nav: a single centered row of sections with mega-menus. */}
      {navSections.length > 0 && (
        <div className="hidden border-t border-border/60 md:block">
          <div className="mx-auto flex max-w-[1440px] justify-center px-6">
            <DesktopSectionNav sections={navSections} />
          </div>
        </div>
      )}
    </header>
  );
}
