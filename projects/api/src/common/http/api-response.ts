import { randomUUID } from 'node:crypto';

/**
 * Standard success envelope shared by every endpoint.
 * Mirrors `documents/04-API-Design.md` §2.
 */
export interface Pagination {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ResponseMeta {
  requestId: string;
  pagination?: Pagination;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/** Wrap a payload in the standard `{ data, meta }` envelope. */
export function apiResponse<T>(data: T, pagination?: Pagination): ApiResponse<T> {
  return {
    data,
    meta: {
      requestId: randomUUID(),
      ...(pagination ? { pagination } : {}),
    },
  };
}
