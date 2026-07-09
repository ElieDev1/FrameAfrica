export interface RecordStatus {
  recorded: boolean;
}

/** Compact article shape for the reader's "Recently read" list. */
export interface HistoryArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  viewedAt: string;
  category: { name: string; slug: string };
  featuredImage: { url: string; alt: string | null } | null;
}
