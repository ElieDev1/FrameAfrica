import type { ArticleLanguage } from '@prisma/client';
import type { Block } from './blocks';

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

export interface TopicRef {
  id: string;
  name: string;
  slug: string;
}

/** Featured image + its required alt/credit metadata (documents/06 §6). */
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

/** A public, dated correction/retraction note on an article. */
export interface CorrectionNote {
  id: string;
  note: string;
  createdAt: string;
}

export interface ArticleDetail extends ArticleSummary {
  /**
   * Legacy plain body, kept for backward compatibility. Prefer `blocks` for
   * rendering. A one-paragraph teaser when `isLocked`.
   */
  body: string;
  /**
   * The structured article document. Pre-block articles are converted from
   * `body` on the fly, so this is always populated. Trimmed to a preview when
   * `isLocked`.
   */
  blocks: Block[];
  seo: unknown;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  updatedAt: string;
  /** Public, dated corrections/retractions, oldest first. */
  corrections: CorrectionNote[];
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

/** A single active topic — the masthead of a topic page. */
export interface TopicDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

/** A single active category — the masthead of a section page. */
export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Parent section, for breadcrumbs (null for a top-level section). */
  parent: { name: string; slug: string } | null;
  /** Active sub-sections, for navigation chips. */
  children: { id: string; name: string; slug: string }[];
}
