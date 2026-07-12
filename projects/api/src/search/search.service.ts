import { Injectable } from '@nestjs/common';
import { type ArticleLanguage, MediaStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  HL_START,
  HL_STOP,
  type MediaSearchResult,
  type SearchResponse,
  type SearchResult,
  type SearchSuggestion,
} from './search.types';

const HEADLINE_OPTS = `StartSel=${HL_START}, StopSel=${HL_STOP}, MaxFragments=2, MinWords=6, MaxWords=24, FragmentDelimiter= … `;

interface Row {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  published_at: Date | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category_name: string;
  category_slug: string;
  snippet: string;
}

/**
 * Full-text search over published articles using PostgreSQL FTS: weighted
 * `ts_rank` relevance (title ≫ subtitle ≫ excerpt ≫ body), `ts_headline`
 * snippets, and `websearch_to_tsquery` so quotes/`-exclusions` work. OpenSearch
 * is the drop-in scale swap behind this same service/endpoint (documents/12
 * Slice 3); a GIN index on the tsvector is the local perf step.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    q: string;
    language?: ArticleLanguage;
    limit?: number;
    page?: number;
  }): Promise<SearchResponse> {
    const q = params.q.trim();
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const page = Math.max(params.page ?? 1, 1);
    if (!q) return { results: [], media: [], hasMore: false, page };
    const offset = (page - 1) * limit;

    const langFilter = params.language
      ? Prisma.sql`AND a.language::text = ${params.language}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
      WITH q AS (SELECT websearch_to_tsquery('english', ${q}) AS query)
      SELECT a.id, a.slug, a.title, a.subtitle, a.excerpt, a.published_at,
             a.featured_image_url, a.featured_image_alt,
             c.name AS category_name, c.slug AS category_slug,
             ts_headline('english',
                left(coalesce(a.title,'') || '. ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.body,''), 4000),
                q.query, ${HEADLINE_OPTS}) AS snippet
      FROM article a
      JOIN category c ON c.id = a.category_id, q
      WHERE a.status = 'published' AND a.deleted_at IS NULL
        AND (
          setweight(to_tsvector('english', coalesce(a.title,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(a.subtitle,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(a.excerpt,'')), 'C') ||
          setweight(to_tsvector('english', coalesce(a.body,'')), 'D')
        ) @@ q.query
        ${langFilter}
      ORDER BY ts_rank(
          setweight(to_tsvector('english', coalesce(a.title,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(a.subtitle,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(a.excerpt,'')), 'C') ||
          setweight(to_tsvector('english', coalesce(a.body,'')), 'D'), q.query) DESC,
        a.published_at DESC
      LIMIT ${limit + 1} OFFSET ${offset}
    `);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    // Multimedia is only worth showing on the first page of results — it's a
    // side-panel of extra hits, not part of the article pagination.
    const media = page === 1 ? await this.searchMedia(q) : [];
    return { results: pageRows.map(toResult), media, hasMore, page };
  }

  /**
   * Search the multimedia library — galleries, podcast episodes, videos and
   * interactives — so search covers the whole site, not just articles. These
   * are small tables with short text, so a case-insensitive title/description
   * match is enough; they don't need the article FTS machinery.
   */
  async searchMedia(rawQ: string, limit = 4): Promise<MediaSearchResult[]> {
    const q = rawQ.trim();
    if (q.length < 2) return [];
    const match = { contains: q, mode: 'insensitive' as const };
    const where = (extra: object) => ({
      OR: [{ title: match }, { description: match }],
      ...extra,
    });
    const published = { status: MediaStatus.published, deletedAt: null };

    const [galleries, episodes, videos, interactives] = await Promise.all([
      this.prisma.gallery.findMany({
        where: where(published),
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
      this.prisma.podcastEpisode.findMany({
        where: where(published),
        select: {
          id: true,
          title: true,
          description: true,
          coverUrl: true,
          publishedAt: true,
          show: { select: { slug: true, coverUrl: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
      this.prisma.video.findMany({
        where: where({ isHidden: false }),
        select: {
          id: true,
          youtubeId: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
      this.prisma.interactive.findMany({
        where: where(published),
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverUrl: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
    ]);

    return [
      ...galleries.map((g): MediaSearchResult => ({
        kind: 'gallery',
        id: g.id,
        title: g.title,
        description: g.description,
        imageUrl: g.coverUrl,
        url: `/galleries/${g.slug}`,
        publishedAt: g.publishedAt?.toISOString() ?? null,
      })),
      ...episodes.map((e): MediaSearchResult => ({
        kind: 'episode',
        id: e.id,
        title: e.title,
        description: e.description,
        imageUrl: e.coverUrl ?? e.show.coverUrl,
        url: `/podcasts/${e.show.slug}`,
        publishedAt: e.publishedAt?.toISOString() ?? null,
      })),
      ...videos.map((v): MediaSearchResult => ({
        kind: 'video',
        id: v.id,
        title: v.title,
        description: v.description,
        imageUrl: v.thumbnailUrl ?? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
        url: '/videos',
        publishedAt: v.publishedAt.toISOString(),
      })),
      ...interactives.map((i): MediaSearchResult => ({
        kind: 'interactive',
        id: i.id,
        title: i.title,
        description: i.description,
        imageUrl: i.coverUrl,
        url: `/interactives/${i.slug}`,
        publishedAt: i.publishedAt?.toISOString() ?? null,
      })),
    ];
  }

  /**
   * Lightweight title autocomplete for the search box. Uses `ILIKE` so partial
   * words (prefixes) match as the reader types — titles that *start* with the
   * term rank first. Escapes LIKE wildcards in the input.
   */
  async suggest(rawQ: string): Promise<SearchSuggestion[]> {
    const q = rawQ.trim();
    if (q.length < 2) return [];
    const escaped = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    return this.prisma.$queryRaw<SearchSuggestion[]>(Prisma.sql`
      SELECT a.title, a.slug
      FROM article a
      WHERE a.status = 'published' AND a.deleted_at IS NULL
        AND a.title ILIKE ${`%${escaped}%`}
      ORDER BY (a.title ILIKE ${`${escaped}%`}) DESC, a.published_at DESC
      LIMIT 6
    `);
  }
}

function toResult(r: Row): SearchResult {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    excerpt: r.excerpt,
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
    snippet: r.snippet,
    category: { name: r.category_name, slug: r.category_slug },
    featuredImage: r.featured_image_url
      ? { url: r.featured_image_url, alt: r.featured_image_alt }
      : null,
  };
}
