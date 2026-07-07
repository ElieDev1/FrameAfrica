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

export interface TopicRef {
  id: string;
  name: string;
  slug: string;
}

export interface FeaturedImage {
  url: string;
  alt: string | null;
  credit: string | null;
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
  featuredImage: FeaturedImage | null;
  category: CategoryRef;
  author: AuthorSummary;
  topics: TopicRef[];
}

/** A photo inside a gallery block. */
export interface BlockImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

/**
 * A single unit of the structured article document (mirrors the API's block
 * model, documents/13 §2). Text fields are pre-sanitised server-side and are
 * additionally output-encoded by React on render.
 */
export type Block =
  | { type: 'paragraph'; text: string; lede?: boolean }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'image'; url: string; alt: string; caption?: string; credit?: string }
  | { type: 'gallery'; images: BlockImage[] }
  | { type: 'pullquote'; text: string; attribution?: string }
  | { type: 'blockquote'; text: string; attribution?: string }
  | { type: 'list'; style: 'bullet' | 'number'; items: string[] }
  | { type: 'factbox'; title: string; body: string }
  | { type: 'embed'; provider: 'youtube'; url: string; embedUrl: string; caption?: string }
  | { type: 'divider' };

export interface ArticleDetail extends ArticleSummary {
  /** Legacy plain body, kept for compatibility. Prefer `blocks` for rendering. */
  body: string;
  /** The structured article document — always populated (converted if legacy). */
  blocks: Block[];
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
  parent: { name: string; slug: string } | null;
  children: { id: string; name: string; slug: string }[];
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

export interface TopicDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ListArticlesParams {
  category?: string;
  topic?: string;
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
  if (params.topic) search.set('topic', params.topic);
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

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: CommentAuthor;
  replies: Comment[];
}

/** Visible comments for an article (fresh — not cached), or `[]` on any error. */
export async function fetchComments(articleId: string): Promise<Comment[]> {
  try {
    const res = await fetch(`${API_URL}/articles/${encodeURIComponent(articleId)}/comments`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const envelope = (await res.json()) as ApiEnvelope<Comment[]>;
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

/** Returns the topic, or `null` if the API responds 404. */
export async function fetchTopic(slug: string): Promise<TopicDetail | null> {
  try {
    const envelope = await apiGet<TopicDetail>(`/topics/${encodeURIComponent(slug)}`);
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
