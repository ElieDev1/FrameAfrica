export interface BookmarkStatus {
  saved: boolean;
}

/** Compact article shape for the reader's "Saved" list. */
export interface SavedArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  category: { name: string; slug: string };
  featuredImage: { url: string; alt: string | null } | null;
}
