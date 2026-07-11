import type { MediaStatus, PodcastMediaKind } from '@prisma/client';

export interface EpisodeView {
  id: string;
  showId: string;
  slug: string;
  title: string;
  description: string | null;
  mediaKind: PodcastMediaKind;
  mediaUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  episodeNo: number | null;
  status: MediaStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface ShowView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  rssUrl: string | null;
  status: MediaStatus;
  episodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShowDetail extends ShowView {
  episodes: EpisodeView[];
}
