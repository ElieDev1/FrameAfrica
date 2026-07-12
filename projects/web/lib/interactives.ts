import { pageQuery } from './paging';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface PublicInteractive {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  provider: 'datawrapper' | 'flourish' | 'infogram' | 'google' | 'youtube';
  embedUrl: string;
  coverUrl: string | null;
  aspectRatio: string;
  source: string | null;
  publishedAt: string | null;
}

/** One page of published interactives for the hub's pager. */
export async function fetchInteractivesPage(
  limit: number,
  page: number,
  q?: string,
): Promise<{ items: PublicInteractive[]; hasMore: boolean }> {
  try {
    const res = await fetch(`${API_URL}/interactives?${pageQuery(limit, page, q)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { items: [], hasMore: false };
    const json = (await res.json()) as {
      data: PublicInteractive[];
      meta?: { pagination?: { hasMore: boolean } };
    };
    return { items: json.data, hasMore: Boolean(json.meta?.pagination?.hasMore) };
  } catch {
    return { items: [], hasMore: false };
  }
}

/** Published interactives for the hub, or [] on any error. */
export async function fetchInteractives(limit = 30): Promise<PublicInteractive[]> {
  try {
    const res = await fetch(`${API_URL}/interactives?limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PublicInteractive[] };
    return json.data;
  } catch {
    return [];
  }
}

/** A single published interactive by slug, or null if missing. */
export async function fetchInteractive(slug: string): Promise<PublicInteractive | null> {
  try {
    const res = await fetch(`${API_URL}/interactives/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicInteractive };
    return json.data;
  } catch {
    return null;
  }
}
