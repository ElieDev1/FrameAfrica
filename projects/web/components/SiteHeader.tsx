import Link from 'next/link';
import { fetchCategories, type CategoryNode } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Wordmark } from './Wordmark';

const MAX_SECTIONS = 6;
const STAFF_ROLES = ['journalist', 'editor', 'admin'];
const EDITOR_ROLES = ['editor', 'admin'];

/** Top bar: brand + section nav + auth-aware actions. */
export async function SiteHeader() {
  let sections: CategoryNode[] = [];
  try {
    sections = (await fetchCategories()).slice(0, MAX_SECTIONS);
  } catch {
    sections = []; // header still renders if the API is unreachable
  }
  const user = await getSession();
  const isStaff = user?.roles.some((role) => STAFF_ROLES.includes(role)) ?? false;
  const isEditor = user?.roles.some((role) => EDITOR_ROLES.includes(role)) ?? false;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" aria-label="Frame Africa — home">
          <Wordmark />
        </Link>
        <nav className="hidden flex-wrap gap-4 md:flex">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/section/${section.slug}`}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
            >
              {section.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <form action="/search" className="hidden sm:block">
            <input
              name="q"
              type="search"
              placeholder="Search…"
              aria-label="Search articles"
              className="w-36 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-body text-sm text-text outline-none transition-[width] focus:w-52 focus:border-primary"
            />
          </form>
          {user ? (
            <>
              {isStaff && (
                <Link
                  href="/cms"
                  className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
                >
                  Write
                </Link>
              )}
              {isEditor && (
                <Link
                  href="/cms/review"
                  className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
                >
                  Review
                </Link>
              )}
              <Link
                href="/account"
                className="font-mono text-xs uppercase tracking-[0.12em] text-text hover:text-primary"
              >
                {user.displayName}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-black hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
