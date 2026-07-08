import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { getSession } from '@/lib/session';
import { DesktopSectionNav } from './nav/DesktopSectionNav';
import { MobileMenu } from './nav/MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';

const MAX_SECTIONS = 8;
const STAFF_ROLES = ['journalist', 'editor', 'admin'];
const EDITOR_ROLES = ['editor', 'admin'];

/** Top bar: brand + section nav + auth-aware actions. Hidden on the dashboard. */
export async function SiteHeader() {
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (pathname.startsWith('/dashboard')) return null;

  let allSections: CategoryNode[] = [];
  try {
    allSections = await fetchCategories();
  } catch {
    allSections = []; // header still renders if the API is unreachable
  }
  const navSections = allSections.slice(0, MAX_SECTIONS);
  const user = await getSession();
  const isStaff = user?.roles.some((role) => STAFF_ROLES.includes(role)) ?? false;
  const isEditor = user?.roles.some((role) => EDITOR_ROLES.includes(role)) ?? false;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" aria-label="Frame Africa — home" className="shrink-0">
          <Wordmark />
        </Link>
        <DesktopSectionNav sections={navSections} />

        <div className="ml-auto flex items-center gap-3">
          <form action="/search" className="hidden md:block">
            <input
              name="q"
              type="search"
              placeholder="Search…"
              aria-label="Search articles"
              className="w-36 rounded-full border border-border bg-surface-2 px-4 py-1.5 font-body text-sm text-text outline-none transition-[width,border-color] focus:w-52 focus:border-primary"
            />
          </form>
          <ThemeToggle />

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                {isStaff && (
                  <Link
                    href="/dashboard"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-primary"
                  >
                    Write
                  </Link>
                )}
                {isEditor && (
                  <Link
                    href="/dashboard/review"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-primary"
                  >
                    Review
                  </Link>
                )}
                <Link
                  href="/account"
                  className="rounded-full border border-border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text transition-colors hover:border-primary hover:text-primary"
                >
                  {user.displayName.split(' ')[0]}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-primary"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-black shadow-[0_2px_16px_-4px_var(--color-primary)] transition-transform hover:-translate-y-px"
                >
                  Subscribe
                </Link>
              </>
            )}
          </div>

          <MobileMenu
            sections={allSections}
            signedIn={Boolean(user)}
            isStaff={isStaff}
            isEditor={isEditor}
            firstName={user?.displayName.split(' ')[0] ?? null}
          />
        </div>
      </div>
    </header>
  );
}
