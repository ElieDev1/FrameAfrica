/** How many cards a multimedia hub shows per page. */
export const PAGE_SIZE = 24;

/** Read `?page=` off the URL — anything that isn't a page number is page one. */
export function readPage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1;
}

/** Build a hub list query string (`limit`, `page`, optional `q`). */
export function pageQuery(limit: number, page: number, q?: string): string {
  const search = new URLSearchParams({ limit: String(limit), page: String(page) });
  const term = q?.trim();
  if (term) search.set('q', term);
  return search.toString();
}
