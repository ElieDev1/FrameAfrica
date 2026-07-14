import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthorProfile } from './content.types';

/** Fields safe to read for a byline. Never touches email, phone, or a hash. */
const authorSelect = {
  id: true,
  authorSlug: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  jobTitle: true,
} satisfies Prisma.UserSelect;

type AuthorRow = Prisma.UserGetPayload<{ select: typeof authorSelect }>;

/**
 * Public author pages (documents/14 §2). A byline is a promise about who stands
 * behind a story, so it has to lead somewhere: `/author/<slug>` is that page.
 *
 * Only a *published* writer is visible. Every user carries a slug, but a reader
 * or a journalist with nothing out yet has no page — asking for one is a 404,
 * not an empty profile, so the site never leaks the existence of an account.
 */
@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everyone who has published, most prolific first — the "Our journalists" page. */
  async list(): Promise<AuthorProfile[]> {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null, authorSlug: { not: null }, articles: { some: publishedFilter } },
      select: {
        ...authorSelect,
        _count: { select: { articles: { where: publishedFilter } } },
        articles: {
          where: publishedFilter,
          select: { publishedAt: true },
          orderBy: { publishedAt: 'desc' },
          take: 1,
        },
      },
    });

    return rows
      .map((row) =>
        toProfile(row, row._count.articles, row.articles[0]?.publishedAt?.toISOString() ?? null),
      )
      .sort(
        (a, b) => b.articleCount - a.articleCount || a.displayName.localeCompare(b.displayName),
      );
  }

  /** One author's page. 404 for a slug that has never published. */
  async bySlug(slug: string): Promise<AuthorProfile> {
    const row = await this.prisma.user.findFirst({
      where: { authorSlug: slug, deletedAt: null, articles: { some: publishedFilter } },
      select: {
        ...authorSelect,
        _count: { select: { articles: { where: publishedFilter } } },
        articles: {
          where: publishedFilter,
          select: { publishedAt: true },
          orderBy: { publishedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!row) throw new NotFoundException('Author not found');

    return toProfile(row, row._count.articles, row.articles[0]?.publishedAt?.toISOString() ?? null);
  }
}

/** A story is only an author's public work once it is actually out. */
const publishedFilter = {
  status: ArticleStatus.published,
  deletedAt: null,
} satisfies Prisma.ArticleWhereInput;

function toProfile(
  row: AuthorRow,
  articleCount: number,
  lastPublishedAt: string | null,
): AuthorProfile {
  return {
    // Guaranteed by the `authorSlug: { not: null }` / slug lookup above.
    slug: row.authorSlug!,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    jobTitle: row.jobTitle,
    articleCount,
    lastPublishedAt,
  };
}
