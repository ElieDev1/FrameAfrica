import type { ArticleLanguage, ArticleStatus } from '@prisma/client';
import type { Block } from '../blocks';

interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** A row in the journalist's draft list. */
export interface DraftListItem {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  language: ArticleLanguage;
  isPremium: boolean;
  updatedAt: string;
  category: CategoryRef;
}

/** Full editable draft returned to its author. */
export interface DraftDetail extends DraftListItem {
  subtitle: string | null;
  excerpt: string | null;
  body: string;
  /** The structured block document, or null for legacy plain-body drafts. */
  blocks: Block[] | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  featuredImageCredit: string | null;
  createdAt: string;
}

export interface RevisionItem {
  id: string;
  changeNote: string | null;
  createdAt: string;
  editor: { id: string; displayName: string };
}
