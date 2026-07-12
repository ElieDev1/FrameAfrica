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

/** A hit in the multimedia library — a gallery, podcast episode, video or interactive. */
export interface MediaSearchResult {
  kind: 'gallery' | 'episode' | 'video' | 'interactive';
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  /** The public page this hit links to. */
  url: string;
  publishedAt: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  /** Matching multimedia, so search covers the whole site — not just articles. */
  media: MediaSearchResult[];
  hasMore: boolean;
  page: number;
}
