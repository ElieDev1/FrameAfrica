import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaAsset, Prisma } from '@prisma/client';
import { slugify } from '../common/slug';
import { StorageService } from '../common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaAlbumDto, MediaAssetDto, UploadedImage } from './media.types';

/** Accepted image types → file extension. Everything else is rejected. */
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Accepted audio/video types → extension, for podcast/video uploads. */
const ALLOWED_AV_TYPES: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const MAX_AV_BYTES = 200 * 1024 * 1024; // 200 MB

export interface UploadMeta {
  alt?: string;
  credit?: string;
  licence?: string;
  /** File the upload straight into an event album. */
  albumId?: string;
}

/**
 * Which slice of the library to list: an album's id, the literal `'unfiled'`
 * (files in no album), or undefined for everything.
 */
export type AlbumFilter = string | undefined;

/** Which file kinds to list — the explorer's type tabs. */
export type KindFilter = 'image' | 'video' | 'audio' | undefined;

export interface CreateAlbumInput {
  name: string;
  description?: string;
  eventDate?: string;
  coverUrl?: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Validate + store an uploaded image and catalogue it (documents/13 §5). */
  async upload(
    uploaderId: string,
    file: UploadedImage | undefined,
    meta: UploadMeta,
  ): Promise<MediaAssetDto> {
    if (!file) {
      throw new BadRequestException('No file was uploaded (field "file")');
    }
    const ext = ALLOWED_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Unsupported image type (JPEG, PNG, WebP, GIF, or AVIF only)');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large (max 8 MB)');
    }

    const { url } = await this.storage.save(file.buffer, ext);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        uploaderId,
        albumId: meta.albumId || null,
        url,
        mime: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname?.slice(0, 200) || null,
        alt: meta.alt?.trim() || null,
        credit: meta.credit?.trim() || null,
        licence: meta.licence?.trim() || null,
      },
    });
    return toDto(asset);
  }

  /**
   * Store an uploaded audio or video file (podcast episodes, self-hosted video
   * clips) and catalogue it. Larger limit than images; same media library.
   */
  async uploadAV(
    uploaderId: string,
    file: UploadedImage | undefined,
    meta: UploadMeta,
  ): Promise<MediaAssetDto> {
    if (!file) {
      throw new BadRequestException('No file was uploaded (field "file")');
    }
    const ext = ALLOWED_AV_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Unsupported media type (MP3/M4A/AAC/OGG/WAV or MP4/WebM only)',
      );
    }
    if (file.size > MAX_AV_BYTES) {
      throw new BadRequestException('File too large (max 200 MB)');
    }

    const { url } = await this.storage.save(file.buffer, ext);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        uploaderId,
        albumId: meta.albumId || null,
        url,
        mime: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname?.slice(0, 200) || null,
        credit: meta.credit?.trim() || null,
        licence: meta.licence?.trim() || null,
      },
    });
    return toDto(asset);
  }

  /**
   * One page of the library, newest first — optionally narrowed to an album (or
   * the unfiled pile) and to one kind of file. This is what the explorer browses.
   */
  async list(
    limit = 24,
    page = 1,
    album: AlbumFilter = undefined,
    kind: KindFilter = undefined,
  ): Promise<{ items: MediaAssetDto[]; hasMore: boolean }> {
    const where: Prisma.MediaAssetWhereInput = {};
    if (album === 'unfiled') where.albumId = null;
    else if (album) where.albumId = album;
    if (kind) where.mime = { startsWith: `${kind}/` };

    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * take,
      take: take + 1, // one extra row answers "is there a next page?"
    });
    return { items: rows.slice(0, take).map(toDto), hasMore: rows.length > take };
  }

  /** How the library breaks down by file kind — the explorer's header stats. */
  async counts(): Promise<{ total: number; image: number; video: number; audio: number }> {
    const [total, image, video, audio] = await Promise.all([
      this.prisma.mediaAsset.count(),
      this.prisma.mediaAsset.count({ where: { mime: { startsWith: 'image/' } } }),
      this.prisma.mediaAsset.count({ where: { mime: { startsWith: 'video/' } } }),
      this.prisma.mediaAsset.count({ where: { mime: { startsWith: 'audio/' } } }),
    ]);
    return { total, image, video, audio };
  }

  /** Remove an asset from the library. Articles keep their stored URL string. */
  async remove(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media not found');
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
  }

  // ── Albums ────────────────────────────────────────────────────────────────

  /** Every album with its file count and a cover (its own, or the newest file). */
  async listAlbums(): Promise<MediaAlbumDto[]> {
    const rows = await this.prisma.mediaAlbum.findMany({
      orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { assets: true } },
        // Newest image in the album, to stand in as a cover when none is set.
        assets: {
          where: { mime: { startsWith: 'image/' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { url: true },
        },
      },
    });
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      description: a.description,
      eventDate: a.eventDate?.toISOString() ?? null,
      coverUrl: a.coverUrl ?? a.assets[0]?.url ?? null,
      assetCount: a._count.assets,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /** How many files sit outside any album — the "Unfiled" bucket. */
  async unfiledCount(): Promise<number> {
    return this.prisma.mediaAsset.count({ where: { albumId: null } });
  }

  async createAlbum(createdById: string, input: CreateAlbumInput): Promise<MediaAlbumDto> {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('An album needs a name');

    const album = await this.prisma.mediaAlbum.create({
      data: {
        createdById,
        name,
        slug: await this.uniqueSlug(name),
        description: input.description?.trim() || null,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
        coverUrl: input.coverUrl?.trim() || null,
      },
    });
    return {
      id: album.id,
      name: album.name,
      slug: album.slug,
      description: album.description,
      eventDate: album.eventDate?.toISOString() ?? null,
      coverUrl: album.coverUrl,
      assetCount: 0,
      createdAt: album.createdAt.toISOString(),
    };
  }

  async updateAlbum(id: string, input: Partial<CreateAlbumInput>): Promise<MediaAlbumDto> {
    await this.assertAlbum(id);
    await this.prisma.mediaAlbum.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.eventDate !== undefined
          ? { eventDate: input.eventDate ? new Date(input.eventDate) : null }
          : {}),
        ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl.trim() || null } : {}),
      },
    });
    const [album] = await this.listAlbums().then((all) => all.filter((a) => a.id === id));
    return album;
  }

  /** Delete an album. Its files are unfiled (SET NULL), never deleted. */
  async deleteAlbum(id: string): Promise<void> {
    await this.assertAlbum(id);
    await this.prisma.mediaAlbum.delete({ where: { id } });
  }

  /** File a asset into an album, or pass null to unfile it. */
  async setAssetAlbum(assetId: string, albumId: string | null): Promise<MediaAssetDto> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Media not found');
    if (albumId) await this.assertAlbum(albumId);

    const updated = await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { albumId },
    });
    return toDto(updated);
  }

  private async assertAlbum(id: string): Promise<void> {
    const found = await this.prisma.mediaAlbum.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Album not found');
  }

  /** `kigali-summit`, `kigali-summit-2`, … */
  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'album';
    let slug = base;
    for (let i = 2; ; i += 1) {
      const clash = await this.prisma.mediaAlbum.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${i}`;
    }
  }
}

function toDto(asset: MediaAsset): MediaAssetDto {
  return {
    id: asset.id,
    url: asset.url,
    alt: asset.alt,
    credit: asset.credit,
    licence: asset.licence,
    mime: asset.mime,
    sizeBytes: asset.sizeBytes,
    originalName: asset.originalName,
    albumId: asset.albumId,
    createdAt: asset.createdAt.toISOString(),
  };
}
