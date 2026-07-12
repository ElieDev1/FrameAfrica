import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { textFilter } from '../common/prisma/text-filter';
import { PrismaService } from '../prisma/prisma.service';

export interface VideoView {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
}

export interface AdminVideoView extends VideoView {
  isFeatured: boolean;
  isHidden: boolean;
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
 * hub degrades to an empty state until an admin configures them. Editors can
 * also curate the cache by hand: add a clip by URL, feature it, hide it, or
 * delete it.
 */
@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AdminSettingsService,
  ) {}

  /** Cached, visible uploads for the public hub — featured first, then newest. */
  async list(limit = 12): Promise<VideoView[]> {
    const rows = await this.prisma.video.findMany({
      where: { isHidden: false },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: Math.min(Math.max(limit, 1), MAX_ITEMS),
    });
    return rows.map(toView);
  }

  /** One page of visible clips, for the hub's pager (optional `q` filter). */
  async listPage(
    limit: number,
    page: number,
    q?: string,
  ): Promise<{ items: VideoView[]; hasMore: boolean }> {
    const take = Math.min(Math.max(limit, 1), MAX_ITEMS);
    const rows = await this.prisma.video.findMany({
      where: { isHidden: false, ...textFilter(q) },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      skip: (Math.max(page, 1) - 1) * take,
      take: take + 1, // one extra row answers "is there a next page?"
    });
    return { items: rows.slice(0, take).map(toView), hasMore: rows.length > take };
  }

  /** A single visible clip, for its public page. */
  async getPublic(id: string): Promise<VideoView> {
    const row = await this.prisma.video.findFirst({ where: { id, isHidden: false } });
    if (!row) throw new NotFoundException('Video not found');
    return toView(row);
  }

  /** Every cached clip (including hidden) for the management dashboard. */
  async listAll(): Promise<AdminVideoView[]> {
    const rows = await this.prisma.video.findMany({
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: 200,
    });
    return rows.map((v) => ({ ...toView(v), isFeatured: v.isFeatured, isHidden: v.isHidden }));
  }

  /**
   * Curate a single clip by pasting a YouTube URL (or bare id). Fetches the
   * title/thumbnail via the API when a key is configured; otherwise falls back
   * to a caller-supplied title. Upserts so re-adding just refreshes it.
   */
  async addByUrl(url: string, title?: string): Promise<AdminVideoView> {
    const youtubeId = parseYoutubeId(url);
    if (!youtubeId) {
      throw new BadRequestException('Not a recognisable YouTube URL or video id');
    }

    let resolvedTitle = title?.trim() || '';
    let description: string | null = null;
    let thumbnailUrl: string | null = null;
    let publishedAt = new Date();

    const apiKey = await this.settings.getValue('YOUTUBE_API_KEY');
    if (apiKey) {
      const meta = await this.fetchVideoMeta(youtubeId, apiKey);
      if (meta) {
        resolvedTitle = resolvedTitle || meta.title;
        description = meta.description;
        thumbnailUrl = meta.thumbnailUrl;
        publishedAt = meta.publishedAt;
      }
    }
    if (!resolvedTitle) {
      throw new BadRequestException('Add a title (no YouTube API key is configured to fetch one)');
    }
    if (!thumbnailUrl) {
      // Deterministic public thumbnail — no API key needed.
      thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    const row = await this.prisma.video.upsert({
      where: { youtubeId },
      update: { title: resolvedTitle, description, thumbnailUrl },
      create: { youtubeId, title: resolvedTitle, description, thumbnailUrl, publishedAt },
    });
    return { ...toView(row), isFeatured: row.isFeatured, isHidden: row.isHidden };
  }

  /** Feature/unfeature or hide/unhide a clip. */
  async setFlags(
    id: string,
    flags: { isFeatured?: boolean; isHidden?: boolean },
  ): Promise<AdminVideoView> {
    await this.ensureExists(id);
    const row = await this.prisma.video.update({
      where: { id },
      data: {
        ...(flags.isFeatured !== undefined ? { isFeatured: flags.isFeatured } : {}),
        ...(flags.isHidden !== undefined ? { isHidden: flags.isHidden } : {}),
      },
    });
    return { ...toView(row), isFeatured: row.isFeatured, isHidden: row.isHidden };
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.video.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.video.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Video not found');
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

  private async fetchVideoMeta(
    videoId: string,
    apiKey: string,
  ): Promise<{
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date;
  } | null> {
    try {
      const res = await fetch(`${YT}/videos?part=snippet&id=${videoId}&key=${apiKey}`);
      if (!res.ok) return null;
      const json = (await res.json()) as { items?: PlaylistItem[] };
      const snippet = json.items?.[0]?.snippet;
      if (!snippet?.title) return null;
      return {
        title: snippet.title,
        description: snippet.description ?? null,
        thumbnailUrl: pickThumbnail({ snippet }),
        publishedAt: new Date(snippet.publishedAt ?? Date.now()),
      };
    } catch {
      return null;
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

function toView(v: {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date;
}): VideoView {
  return {
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt.toISOString(),
  };
}

/**
 * Extract an 11-char YouTube video id from a watch/short/embed/youtu.be URL or a
 * bare id. Returns null for anything else.
 */
export function parseYoutubeId(value: string): string | null {
  const raw = value.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.slice(1);
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (url.pathname.startsWith('/embed/')) id = url.pathname.slice('/embed/'.length);
    else if (url.pathname.startsWith('/shorts/')) id = url.pathname.slice('/shorts/'.length);
    else if (url.pathname.startsWith('/v/')) id = url.pathname.slice('/v/'.length);
  }
  if (!id) return null;
  id = id.split('/')[0];
  return /^[\w-]{11}$/.test(id) ? id : null;
}
