import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type Interactive, InteractiveProvider, MediaStatus, type Prisma } from '@prisma/client';
import { slugify } from '../common/slug';
import { textFilter } from '../common/prisma/text-filter';
import { safeImageUrl, stripText } from '../content/blocks';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInteractiveDto, UpdateInteractiveDto } from './dto/interactive.dto';
import type { InteractiveView } from './interactive.types';

/**
 * Data visualisations / interactive graphics (documents/13 §4.3). Only embeds
 * from an allow-list of trusted providers are accepted, and they render in a
 * sandboxed iframe — so a staffer can never embed an arbitrary hostile page.
 */
@Injectable()
export class InteractivesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(limit = 30): Promise<InteractiveView[]> {
    const rows = await this.prisma.interactive.findMany({
      where: { status: MediaStatus.published, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 60),
    });
    return rows.map(toView);
  }

  /** Public: one page of published interactives, for the hub's pager (optional `q` filter). */
  async listPage(
    limit: number,
    page: number,
    q?: string,
  ): Promise<{ items: InteractiveView[]; hasMore: boolean }> {
    const take = Math.min(Math.max(limit, 1), 60);
    const rows = await this.prisma.interactive.findMany({
      where: { status: MediaStatus.published, deletedAt: null, ...textFilter(q) },
      orderBy: { publishedAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * take,
      take: take + 1, // one extra row answers "is there a next page?"
    });
    return { items: rows.slice(0, take).map(toView), hasMore: rows.length > take };
  }

  async getBySlug(slug: string): Promise<InteractiveView> {
    const row = await this.prisma.interactive.findFirst({
      where: { slug, status: MediaStatus.published, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Interactive not found');
    return toView(row);
  }

  async listAll(): Promise<InteractiveView[]> {
    const rows = await this.prisma.interactive.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map(toView);
  }

  async getById(id: string): Promise<InteractiveView> {
    const row = await this.prisma.interactive.findFirst({ where: { id, deletedAt: null } });
    if (!row) throw new NotFoundException('Interactive not found');
    return toView(row);
  }

  async create(authorId: string, dto: CreateInteractiveDto): Promise<InteractiveView> {
    const title = stripText(dto.title).slice(0, 200);
    if (!title) throw new BadRequestException('A title is required');
    const resolved = resolveEmbed(dto.embedUrl);
    if (!resolved) throw new BadRequestException(embedError);

    const slug = await this.uniqueSlug(slugify(title));
    const row = await this.prisma.interactive.create({
      data: {
        slug,
        title,
        description: cleanText(dto.description, 3000),
        provider: resolved.provider,
        embedUrl: resolved.embedUrl,
        coverUrl: cleanUrl(dto.coverUrl),
        source: cleanText(dto.source, 160),
        aspectRatio: dto.aspectRatio ?? '16/9',
        authorId,
      },
    });
    return toView(row);
  }

  async update(id: string, dto: UpdateInteractiveDto): Promise<InteractiveView> {
    const existing = await this.prisma.interactive.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException('Interactive not found');

    const data: Prisma.InteractiveUpdateInput = {};
    if (dto.title !== undefined) {
      const title = stripText(dto.title).slice(0, 200);
      if (!title) throw new BadRequestException('A title is required');
      data.title = title;
    }
    if (dto.embedUrl !== undefined) {
      const resolved = resolveEmbed(dto.embedUrl);
      if (!resolved) throw new BadRequestException(embedError);
      data.provider = resolved.provider;
      data.embedUrl = resolved.embedUrl;
    }
    if (dto.description !== undefined) data.description = cleanText(dto.description, 3000);
    if (dto.coverUrl !== undefined) data.coverUrl = cleanUrl(dto.coverUrl);
    if (dto.source !== undefined) data.source = cleanText(dto.source, 160);
    if (dto.aspectRatio !== undefined) data.aspectRatio = dto.aspectRatio;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === MediaStatus.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const row = await this.prisma.interactive.update({ where: { id }, data });
    return toView(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.interactive.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Interactive not found');
    await this.prisma.interactive.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async uniqueSlug(base: string): Promise<string> {
    for (let n = 1; ; n += 1) {
      const slug = n === 1 ? base : `${base}-${n}`.slice(0, 90);
      const clash = await this.prisma.interactive.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) return slug;
    }
  }
}

export const embedError =
  'Embed must be a Datawrapper, Flourish, Infogram, Google (Data Studio/Looker/Sheets) or YouTube URL';

/**
 * Validate a pasted embed URL against the provider allow-list and normalise it.
 * Returns null for anything not on the list (so nothing else can be embedded).
 */
export function resolveEmbed(
  raw: string,
): { provider: InteractiveProvider; embedUrl: string } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');

  if (
    host === 'datawrapper.dwcdn.net' ||
    host.endsWith('.dwcdn.net') ||
    host === 'datawrapper.de'
  ) {
    return { provider: InteractiveProvider.datawrapper, embedUrl: url.toString() };
  }
  if (host === 'flo.uri.sh' || host.endsWith('flourish.studio')) {
    return { provider: InteractiveProvider.flourish, embedUrl: url.toString() };
  }
  if (host === 'infogram.com' || host.endsWith('.infogram.com')) {
    return { provider: InteractiveProvider.infogram, embedUrl: url.toString() };
  }
  if (
    host === 'datastudio.google.com' ||
    host === 'lookerstudio.google.com' ||
    host === 'docs.google.com' ||
    host === 'google.com'
  ) {
    return { provider: InteractiveProvider.google, embedUrl: url.toString() };
  }
  const yt = youtubeEmbed(url, host);
  if (yt) return { provider: InteractiveProvider.youtube, embedUrl: yt };

  return null;
}

function youtubeEmbed(url: URL, host: string): string | null {
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (url.pathname.startsWith('/embed/')) id = url.pathname.slice(7);
  }
  id = id?.split('/')[0] ?? null;
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function cleanText(value: string | undefined, max: number): string | null {
  if (value === undefined) return null;
  return stripText(value).slice(0, max) || null;
}
function cleanUrl(value: string | undefined): string | null {
  if (!value) return null;
  return safeImageUrl(value);
}

function toView(row: Interactive): InteractiveView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    provider: row.provider,
    embedUrl: row.embedUrl,
    coverUrl: row.coverUrl,
    aspectRatio: row.aspectRatio,
    source: row.source,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
