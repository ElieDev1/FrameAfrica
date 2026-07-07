import type { ArticleLanguage } from '@prisma/client';

/**
 * Public-facing response shapes for the content module. These are the only
 * article/category fields exposed to unauthenticated readers — internal columns
 * (workflow status, scheduling, soft-delete, etc.) are never serialized here.
 */

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

/** A single active category — the masthead of a section page. */
export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}
