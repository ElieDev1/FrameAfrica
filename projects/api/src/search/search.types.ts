/** Delimiters ts_headline wraps matched terms in; the web splits on them to
 * render `<mark>` safely (these control chars never occur in article text, so
 * highlighting can't inject markup). */
export const HL_START = String.fromCharCode(2);
export const HL_STOP = String.fromCharCode(3);

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  /** A snippet with matched terms wrapped in HL_START/HL_STOP. */
  snippet: string;
  category: { name: string; slug: string };
  featuredImage: { url: string; alt: string | null } | null;
}

export interface SearchSuggestion {
  title: string;
  slug: string;
}

export interface SearchResponse {
  results: SearchResult[];
  hasMore: boolean;
  page: number;
}
