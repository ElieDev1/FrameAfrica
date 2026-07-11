import type { MediaStatus } from '@prisma/client';

/** A single photo in a gallery — url + required alt, optional caption/credit. */
export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

/** Card shape for the public hub and the staff list. */
export interface GalleryListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  imageCount: number;
  status: MediaStatus;
  publishedAt: string | null;
  updatedAt: string;
}

/** Full gallery incl. its ordered photos. */
export interface GalleryDetail extends GalleryListItem {
  images: GalleryImage[];
  author: { id: string; displayName: string } | null;
}
