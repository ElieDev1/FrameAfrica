import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaAsset } from '@prisma/client';
import { StorageService } from '../common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaAssetDto, UploadedImage } from './media.types';

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

  /** The newest assets in the library (most recent first). */
  async list(limit = 60): Promise<MediaAssetDto[]> {
    const rows = await this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toDto);
  }

  /** Remove an asset from the library. Articles keep their stored URL string. */
  async remove(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media not found');
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
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
    createdAt: asset.createdAt.toISOString(),
  };
}
