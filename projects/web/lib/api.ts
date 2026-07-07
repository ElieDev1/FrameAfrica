/**
 * Typed client for the Frame Africa read API. Used from Server Components, so it
 * talks to the API directly (server-to-server) via API_URL. Only the `data`
 * payload is returned to callers; the `{ data, meta }` envelope stays here.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type ArticleLanguage = 'en' | 'rw' | 'fr' | 'sw';

export interface AuthorSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  language: ArticleLanguage;
  isPremium: boolean;
  isBreaking: boolean;
  readTimeMin: number | null;
  publishedAt: string | null;
  category: CategoryRef;
  author: AuthorSummary;
}

export interface ArticleDetail extends ArticleSummary {
  /** Full body when readable for free; a one-paragraph teaser when `isLocked`. */
  body: string;
  seo: unknown;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  updatedAt: string;
  /** True when this is premium content and the caller has no active subscription. */
  isLocked: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  children: CategoryNode[];
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Pagination {
  nextCursor: string | null;
  hasMore: boolean;
}

interface ApiEnvelope<T> {
  data: T;
  meta: { requestId: string; pagination?: Pagination };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const REVALIDATE_SECONDS = 60;

async function apiGet<T>(path: string, acceptStatuses: number[] = []): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok && !acceptStatuses.includes(res.status)) {
    throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  }

  return res.json() as Promise<ApiEnvelope<T>>;
}

export interface ListArticlesParams {
  category?: string;
  language?: ArticleLanguage;
  q?: string;
  sort?: 'latest' | 'popular';
  limit?: number;
  cursor?: string;
}

export async function fetchArticles(
  params: ListArticlesParams = {},
): Promise<{ articles: ArticleSummary[]; pagination?: Pagination }> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.language) search.set('language', params.language);
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.cursor) search.set('cursor', params.cursor);

  const query = search.toString();
  const envelope = await apiGet<ArticleSummary[]>(`/articles${query ? `?${query}` : ''}`);
  return { articles: envelope.data, pagination: envelope.meta.pagination };
}

/**
 * Returns the article, or `null` if the API responds 404. A 402 response still
 * carries a valid (locked/preview) payload — see `ArticleDetail.isLocked`.
 */
export async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    const envelope = await apiGet<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`, [402]);
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Up to 4 related articles (same category). Returns `[]` on any error. */
export async function fetchRelated(slug: string): Promise<ArticleSummary[]> {
  try {
    const envelope = await apiGet<ArticleSummary[]>(
      `/articles/${encodeURIComponent(slug)}/related`,
    );
    return envelope.data;
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<CategoryNode[]> {
  const envelope = await apiGet<CategoryNode[]>('/categories');
  return envelope.data;
}

/** Returns the category, or `null` if the API responds 404. */
export async function fetchCategory(slug: string): Promise<CategoryDetail | null> {
  try {
    const envelope = await apiGet<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`);
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
