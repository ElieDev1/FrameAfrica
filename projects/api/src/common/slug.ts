const COMBINING_MARKS = /\p{Diacritic}/gu;
const NON_ALNUM = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/** Turn a title into a URL-safe slug (lowercase, ASCII, hyphenated, ≤ 80 chars). */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALNUM, '-')
    .replace(EDGE_HYPHENS, '')
    .slice(0, 80)
    .replace(EDGE_HYPHENS, '');
  return slug || 'article';
}
