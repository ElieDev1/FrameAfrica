import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MediaStatus,
  type PodcastEpisode,
  PodcastMediaKind,
  type PodcastShow,
  type Prisma,
} from '@prisma/client';
import { slugify } from '../common/slug';
import { textFilter } from '../common/prisma/text-filter';
import { safeImageUrl, stripText } from '../content/blocks';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEpisodeDto, UpdateEpisodeDto } from './dto/episode.dto';
import type { CreateShowDto, UpdateShowDto } from './dto/show.dto';
import type { EpisodeView, ShowDetail, ShowView } from './podcast.types';

/**
 * Podcasts (documents/13 §4.3): shows group episodes, and an episode is audio
 * OR video (uploaded file, external URL, or a YouTube/embed link). Readers see
 * only published shows/episodes; URLs + text are sanitised on write.
 */
@Injectable()
export class PodcastsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Public ---

  async listShows(): Promise<ShowView[]> {
    const rows = await this.prisma.podcastShow.findMany({
      where: { status: MediaStatus.published, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { episodes: { where: publishedEpisode } } } },
    });
    return rows.map(toShowView);
  }

  /** Public: one page of published shows, for the hub's pager (optional `q` filter). */
  async listShowsPage(
    limit: number,
    page: number,
    q?: string,
  ): Promise<{ items: ShowView[]; hasMore: boolean }> {
    const take = Math.min(Math.max(limit, 1), 60);
    const rows = await this.prisma.podcastShow.findMany({
      where: { status: MediaStatus.published, deletedAt: null, ...textFilter(q) },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { episodes: { where: publishedEpisode } } } },
      skip: (Math.max(page, 1) - 1) * take,
      take: take + 1, // one extra row answers "is there a next page?"
    });
    return { items: rows.slice(0, take).map(toShowView), hasMore: rows.length > take };
  }

  async getShow(slug: string): Promise<ShowDetail> {
    const show = await this.prisma.podcastShow.findFirst({
      where: { slug, status: MediaStatus.published, deletedAt: null },
      include: {
        episodes: { where: publishedEpisode, orderBy: { publishedAt: 'desc' } },
        _count: { select: { episodes: { where: publishedEpisode } } },
      },
    });
    if (!show) throw new NotFoundException('Show not found');
    return toShowDetail(show);
  }

  // --- Staff ---

  async listAllShows(): Promise<ShowView[]> {
    const rows = await this.prisma.podcastShow.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { episodes: { where: { deletedAt: null } } } } },
    });
    return rows.map(toShowView);
  }

  async getShowById(id: string): Promise<ShowDetail> {
    const show = await this.prisma.podcastShow.findFirst({
      where: { id, deletedAt: null },
      include: {
        episodes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        _count: { select: { episodes: { where: { deletedAt: null } } } },
      },
    });
    if (!show) throw new NotFoundException('Show not found');
    return toShowDetail(show);
  }

  async createShow(createdById: string, dto: CreateShowDto): Promise<ShowDetail> {
    const title = stripText(dto.title).slice(0, 160);
    if (!title) throw new BadRequestException('A title is required');
    const slug = await this.uniqueShowSlug(slugify(title));
    const show = await this.prisma.podcastShow.create({
      data: {
        slug,
        title,
        description: cleanText(dto.description, 3000),
        coverUrl: cleanUrl(dto.coverUrl),
        spotifyUrl: cleanUrl(dto.spotifyUrl),
        appleUrl: cleanUrl(dto.appleUrl),
        rssUrl: cleanUrl(dto.rssUrl),
        createdById,
      },
      include: { episodes: true, _count: { select: { episodes: true } } },
    });
    return toShowDetail(show);
  }

  async updateShow(id: string, dto: UpdateShowDto): Promise<ShowDetail> {
    const existing = await this.prisma.podcastShow.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Show not found');

    const data: Prisma.PodcastShowUpdateInput = {};
    if (dto.title !== undefined) {
      const title = stripText(dto.title).slice(0, 160);
      if (!title) throw new BadRequestException('A title is required');
      data.title = title;
    }
    if (dto.description !== undefined) data.description = cleanText(dto.description, 3000);
    if (dto.coverUrl !== undefined) data.coverUrl = cleanUrl(dto.coverUrl);
    if (dto.spotifyUrl !== undefined) data.spotifyUrl = cleanUrl(dto.spotifyUrl);
    if (dto.appleUrl !== undefined) data.appleUrl = cleanUrl(dto.appleUrl);
    if (dto.rssUrl !== undefined) data.rssUrl = cleanUrl(dto.rssUrl);
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.podcastShow.update({ where: { id }, data });
    return this.getShowById(id);
  }

  async removeShow(id: string): Promise<void> {
    const existing = await this.prisma.podcastShow.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Show not found');
    await this.prisma.podcastShow.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Episodes ---

  async createEpisode(showId: string, dto: CreateEpisodeDto): Promise<EpisodeView> {
    const show = await this.prisma.podcastShow.findFirst({
      where: { id: showId, deletedAt: null },
      select: { id: true },
    });
    if (!show) throw new NotFoundException('Show not found');

    const title = stripText(dto.title).slice(0, 200);
    if (!title) throw new BadRequestException('A title is required');
    const mediaUrl = safeImageUrl(dto.mediaUrl);
    if (!mediaUrl)
      throw new BadRequestException('A valid media URL (or uploaded file) is required');

    const slug = await this.uniqueEpisodeSlug(slugify(title));
    const episode = await this.prisma.podcastEpisode.create({
      data: {
        showId,
        slug,
        title,
        description: cleanText(dto.description, 5000),
        mediaKind: dto.mediaKind ?? PodcastMediaKind.audio,
        mediaUrl,
        coverUrl: cleanUrl(dto.coverUrl),
        durationSec: dto.durationSec ?? null,
        episodeNo: dto.episodeNo ?? null,
      },
    });
    return toEpisodeView(episode);
  }

  async updateEpisode(id: string, dto: UpdateEpisodeDto): Promise<EpisodeView> {
    const existing = await this.prisma.podcastEpisode.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException('Episode not found');

    const data: Prisma.PodcastEpisodeUpdateInput = {};
    if (dto.title !== undefined) {
      const title = stripText(dto.title).slice(0, 200);
      if (!title) throw new BadRequestException('A title is required');
      data.title = title;
    }
    if (dto.mediaUrl !== undefined) {
      const mediaUrl = safeImageUrl(dto.mediaUrl);
      if (!mediaUrl) throw new BadRequestException('A valid media URL is required');
      data.mediaUrl = mediaUrl;
    }
    if (dto.mediaKind !== undefined) data.mediaKind = dto.mediaKind;
    if (dto.description !== undefined) data.description = cleanText(dto.description, 5000);
    if (dto.coverUrl !== undefined) data.coverUrl = cleanUrl(dto.coverUrl);
    if (dto.durationSec !== undefined) data.durationSec = dto.durationSec;
    if (dto.episodeNo !== undefined) data.episodeNo = dto.episodeNo;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === MediaStatus.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const episode = await this.prisma.podcastEpisode.update({ where: { id }, data });
    return toEpisodeView(episode);
  }

  async removeEpisode(id: string): Promise<void> {
    const existing = await this.prisma.podcastEpisode.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Episode not found');
    await this.prisma.podcastEpisode.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async uniqueShowSlug(base: string): Promise<string> {
    for (let n = 1; ; n += 1) {
      const slug = n === 1 ? base : `${base}-${n}`.slice(0, 90);
      const clash = await this.prisma.podcastShow.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) return slug;
    }
  }

  private async uniqueEpisodeSlug(base: string): Promise<string> {
    for (let n = 1; ; n += 1) {
      const slug = n === 1 ? base : `${base}-${n}`.slice(0, 90);
      const clash = await this.prisma.podcastEpisode.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) return slug;
    }
  }
}

const publishedEpisode = { status: MediaStatus.published, deletedAt: null } as const;

function cleanText(value: string | undefined, max: number): string | null {
  if (value === undefined) return null;
  return stripText(value).slice(0, max) || null;
}

function cleanUrl(value: string | undefined): string | null {
  if (!value) return null;
  return safeImageUrl(value);
}

function toEpisodeView(e: PodcastEpisode): EpisodeView {
  return {
    id: e.id,
    showId: e.showId,
    slug: e.slug,
    title: e.title,
    description: e.description,
    mediaKind: e.mediaKind,
    mediaUrl: e.mediaUrl,
    coverUrl: e.coverUrl,
    durationSec: e.durationSec,
    episodeNo: e.episodeNo,
    status: e.status,
    publishedAt: e.publishedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

function toShowView(show: PodcastShow & { _count: { episodes: number } }): ShowView {
  return {
    id: show.id,
    slug: show.slug,
    title: show.title,
    description: show.description,
    coverUrl: show.coverUrl,
    spotifyUrl: show.spotifyUrl,
    appleUrl: show.appleUrl,
    rssUrl: show.rssUrl,
    status: show.status,
    episodeCount: show._count.episodes,
    createdAt: show.createdAt.toISOString(),
    updatedAt: show.updatedAt.toISOString(),
  };
}

function toShowDetail(
  show: PodcastShow & { episodes: PodcastEpisode[]; _count: { episodes: number } },
): ShowDetail {
  return {
    ...toShowView(show),
    episodes: show.episodes.map(toEpisodeView),
  };
}
