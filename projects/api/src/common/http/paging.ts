import type { Pagination } from './api-response';

/** Read `?limit=&page=` off a query string, falling back to the caller's default. */
export function readPaging(
  limit: string | undefined,
  page: string | undefined,
  defaultLimit: number,
): { limit: number; page: number } {
  const l = Number(limit);
  const p = Number(page);
  return {
    limit: Number.isFinite(l) && l > 0 ? l : defaultLimit,
    page: Number.isFinite(p) && p > 1 ? Math.floor(p) : 1,
  };
}

/** The pagination envelope for a page-numbered list. */
export function pagination(page: number, hasMore: boolean): Pagination {
  return { nextCursor: hasMore ? String(page + 1) : null, hasMore };
}
