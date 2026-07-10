import { fetchArticles, fetchCategories, type CategoryNode } from '@/lib/api';
import { getLocale } from '@/lib/i18n-server';
import { getSession } from '@/lib/session';
import { type FeaturedMap, HeaderClient, type NavUser } from './nav/HeaderClient';

const MAX_SECTIONS = 9;
const STAFF_ROLES = ['journalist', 'editor', 'admin'];
const EDITOR_ROLES = ['editor', 'admin'];

/**
 * Public masthead. Fetches the section tree, the reader's session, and the
 * newest story per top section (for the mega-menu previews), then hands off to
 * the client header which owns scroll-condensing + active-section state.
 */
export async function SiteHeader() {
  let allSections: CategoryNode[] = [];
  try {
    allSections = await fetchCategories();
  } catch {
    allSections = [];
  }
  const navSections = allSections.slice(0, MAX_SECTIONS);
  const locale = await getLocale();
  const user = await getSession();

  // Map every (sub)section slug to its top-level section, so a recent article in
  // any sub-section can headline its parent's mega-menu.
  const childToTop: Record<string, string> = {};
  const walk = (node: CategoryNode, top: string) => {
    childToTop[node.slug] = top;
    node.children.forEach((c) => walk(c, top));
  };
  allSections.forEach((s) => walk(s, s.slug));

  const featured: FeaturedMap = {};
  try {
    const { articles } = await fetchArticles({ limit: 40 });
    for (const a of articles) {
      const top = childToTop[a.category.slug] ?? a.category.slug;
      if (!featured[top]) {
        featured[top] = { title: a.title, slug: a.slug, imageUrl: a.featuredImage?.url ?? null };
      }
    }
  } catch {
    // mega-menu previews are optional
  }

  const navUser: NavUser | null = user
    ? {
        firstName: user.displayName.split(' ')[0],
        name: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isStaff: user.roles.some((r) => STAFF_ROLES.includes(r)),
        isEditor: user.roles.some((r) => EDITOR_ROLES.includes(r)),
        isAdmin: user.roles.includes('admin'),
      }
    : null;

  return (
    <HeaderClient
      sections={navSections}
      allSections={allSections}
      featured={featured}
      user={navUser}
      locale={locale}
    />
  );
}
