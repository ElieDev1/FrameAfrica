import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type Gallery, MediaStatus, type Prisma } from '@prisma/client';
import { safeImageUrl, stripText } from '../content/blocks';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateGalleryDto } from './dto/create-gallery.dto';
import type { UpdateGalleryDto } from './dto/update-gallery.dto';
import type { GalleryDetail, GalleryImage, GalleryListItem } from './gallery.types';

const MAX_IMAGES = 60;

/**
 * Standalone photo galleries (documents/13 §4.3). Photographers + editors build
 * them from media-library images; readers see only published, non-deleted
 * galleries. Image URLs + text are sanitised on write (reuses the article block
 * sanitizer), so a gallery can never carry an unsafe URL or stored markup.
 */
@Injectable()
export class GalleriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: published galleries, newest first (cards only). */
  async listPublished(limit = 24): Promise<GalleryListItem[]> {
    const rows = await this.prisma.gallery.findMany({
      where: { status: MediaStatus.published, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 60),
    });
    return rows.map(toListItem);
  }

  /** Public: a single published gallery by slug, with its photos. */
  async getBySlug(slug: string): Promise<GalleryDetail> {
    const row = await this.prisma.gallery.findFirst({
      where: { slug, status: MediaStatus.published, deletedAt: null },
      include: { author: { select: { id: true, displayName: true } } },
    });
    if (!row) throw new NotFoundException('Gallery not found');
    return toDetail(row);
  }

  /** Staff: every gallery (any status), newest first. */
  async listAll(): Promise<GalleryListItem[]> {
    const rows = await this.prisma.gallery.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map(toListItem);
  }

  /** Staff: a single gallery for editing. */
  async getById(id: string): Promise<GalleryDetail> {
    const row = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null },
      include: { author: { select: { id: true, displayName: true } } },
    });
    if (!row) throw new NotFoundException('Gallery not found');
    return toDetail(row);
  }

  async create(authorId: string, dto: CreateGalleryDto): Promise<GalleryDetail> {
    const title = stripText(dto.title).slice(0, 160);
    if (!title) throw new BadRequestException('A title is required');
    const slug = await this.uniqueSlug(slugify(title));
    const row = await this.prisma.gallery.create({
      data: {
        slug,
        title,
        description: cleanText(dto.description, 2000),
        coverUrl: cleanUrl(dto.coverUrl),
        coverAlt: cleanText(dto.coverAlt, 200),
        images: sanitizeImages(dto.images) as unknown as Prisma.InputJsonValue,
        authorId,
      },
      include: { author: { select: { id: true, displayName: true } } },
    });
    return toDetail(row);
  }

  async update(id: string, dto: UpdateGalleryDto): Promise<GalleryDetail> {
    const existing = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException('Gallery not found');

    const data: Prisma.GalleryUpdateInput = {};
    if (dto.title !== undefined) {
      const title = stripText(dto.title).slice(0, 160);
      if (!title) throw new BadRequestException('A title is required');
      data.title = title;
    }
    if (dto.description !== undefined) data.description = cleanText(dto.description, 2000);
    if (dto.coverUrl !== undefined) data.coverUrl = cleanUrl(dto.coverUrl);
    if (dto.coverAlt !== undefined) data.coverAlt = cleanText(dto.coverAlt, 200);
    if (dto.images !== undefined) {
      data.images = sanitizeImages(dto.images) as unknown as Prisma.InputJsonValue;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
      // Stamp publishedAt the first time it goes live.
      if (dto.status === MediaStatus.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const row = await this.prisma.gallery.update({
      where: { id },
      data,
      include: { author: { select: { id: true, displayName: true } } },
    });
    return toDetail(row);
  }

  /** Soft-delete so URLs stay stable and it drops out of every list. */
  async remove(id: string): Promise<void> {
    const existing = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Gallery not found');
    await this.prisma.gallery.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    for (let n = 2; ; n += 1) {
      const clash = await this.prisma.gallery.findUnique({ where: { slug }, select: { id: true } });
      if (!clash) return slug;
      slug = `${base}-${n}`.slice(0, 90);
    }
  }
}

function cleanText(value: string | undefined, max: number): string | null {
  if (value === undefined) return null;
  return stripText(value).slice(0, max) || null;
}

function cleanUrl(value: string | undefined): string | null {
  if (!value) return null;
  return safeImageUrl(value);
}

/** Validate + sanitise the ordered photo list; silently drops malformed entries. */
export function sanitizeImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  const out: GalleryImage[] = [];
  for (const item of raw.slice(0, MAX_IMAGES)) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === 'string' ? safeImageUrl(rec.url) : null;
    if (!url) continue;
    const image: GalleryImage = {
      url,
      alt: typeof rec.alt === 'string' ? stripText(rec.alt).slice(0, 200) : '',
    };
    if (typeof rec.caption === 'string') {
      const caption = stripText(rec.caption).slice(0, 300);
      if (caption) image.caption = caption;
    }
    if (typeof rec.credit === 'string') {
      const credit = stripText(rec.credit).slice(0, 160);
      if (credit) image.credit = credit;
    }
    out.push(image);
  }
  return out;
}

function imagesOf(row: Gallery): GalleryImage[] {
  return sanitizeImages(row.images);
}

function toListItem(row: Gallery): GalleryListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverUrl: row.coverUrl,
    coverAlt: row.coverAlt,
    imageCount: imagesOf(row).length,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(
  row: Gallery & { author: { id: string; displayName: string } | null },
): GalleryDetail {
  return {
    ...toListItem(row),
    images: imagesOf(row),
    author: row.author,
  };
}
