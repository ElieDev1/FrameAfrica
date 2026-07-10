import { Injectable, Logger } from '@nestjs/common';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { PrismaService } from '../prisma/prisma.service';

export interface VideoView {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
}

export interface SyncResult {
  synced: number;
  reason?: 'not_configured' | 'error';
}

const YT = 'https://www.googleapis.com/youtube/v3';
const MAX_ITEMS = 24;

/**
 * YouTube video hub (documents/14 §3.1). Uploads are synced from the configured
 * channel into a local cache, so page renders never call YouTube. The API key
 * and channel id come from admin settings (DB first, then env), which means the
 * hub degrades to an empty state until an admin configures them.
 */
@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AdminSettingsService,
  ) {}

  /** Cached uploads, newest first. */
  async list(limit = 12): Promise<VideoView[]> {
    const rows = await this.prisma.video.findMany({
      orderBy: { publishedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), MAX_ITEMS),
    });
    return rows.map((v) => ({
      id: v.id,
      youtubeId: v.youtubeId,
      title: v.title,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt.toISOString(),
    }));
  }

  /** Pull the channel's uploads playlist into the cache. Never throws. */
  async sync(): Promise<SyncResult> {
    const [apiKey, channelId] = await Promise.all([
      this.settings.getValue('YOUTUBE_API_KEY'),
      this.settings.getValue('YOUTUBE_CHANNEL_ID'),
    ]);
    if (!apiKey || !channelId) {
      return { synced: 0, reason: 'not_configured' };
    }

    try {
      const uploadsId = await this.uploadsPlaylistId(channelId, apiKey);
      if (!uploadsId) return { synced: 0, reason: 'error' };

      const res = await fetch(
        `${YT}/playlistItems?part=snippet&maxResults=${MAX_ITEMS}&playlistId=${uploadsId}&key=${apiKey}`,
      );
      if (!res.ok) return { synced: 0, reason: 'error' };
      const json = (await res.json()) as { items?: PlaylistItem[] };

      let synced = 0;
      for (const item of json.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId;
        const title = item.snippet?.title;
        if (!videoId || !title) continue;
        await this.prisma.video.upsert({
          where: { youtubeId: videoId },
          update: {
            title,
            description: item.snippet?.description ?? null,
            thumbnailUrl: pickThumbnail(item),
          },
          create: {
            youtubeId: videoId,
            title,
            description: item.snippet?.description ?? null,
            thumbnailUrl: pickThumbnail(item),
            publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
          },
        });
        synced += 1;
      }
      return { synced };
    } catch (error) {
      this.logger.warn(`YouTube sync failed: ${(error as Error).message}`);
      return { synced: 0, reason: 'error' };
    }
  }

  private async uploadsPlaylistId(channelId: string, apiKey: string): Promise<string | null> {
    const res = await fetch(`${YT}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[];
    };
    return json.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
  }
}

interface PlaylistItem {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, { url?: string }>;
  };
}

function pickThumbnail(item: PlaylistItem): string | null {
  const t = item.snippet?.thumbnails;
  return t?.maxres?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;
}
