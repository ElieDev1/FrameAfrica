const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface PublicGalleryImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface PublicGalleryCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  imageCount: number;
  publishedAt: string | null;
}

export interface PublicGallery extends PublicGalleryCard {
  images: PublicGalleryImage[];
  author: { id: string; displayName: string } | null;
}

/** Published galleries for the public hub, or [] on any error. */
export async function fetchGalleries(limit = 24): Promise<PublicGalleryCard[]> {
  try {
    const res = await fetch(`${API_URL}/galleries?limit=${limit}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PublicGalleryCard[] };
    return json.data;
  } catch {
    return [];
  }
}

/** A single published gallery by slug, or null if missing. */
export async function fetchGallery(slug: string): Promise<PublicGallery | null> {
  try {
    const res = await fetch(`${API_URL}/galleries/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicGallery };
    return json.data;
  } catch {
    return null;
  }
}
