import type { InteractiveProvider, MediaStatus } from '@prisma/client';

export interface InteractiveView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  provider: InteractiveProvider;
  embedUrl: string;
  coverUrl: string | null;
  aspectRatio: string;
  source: string | null;
  status: MediaStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
