import { Injectable } from '@nestjs/common';
import { ArticleStatus, CommentStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminOverview {
  users: { total: number; active: number; suspended: number; newLast7Days: number };
  articles: { total: number; published: number; inPipeline: number };
  comments: { visible: number; flagged: number };
  recentArticles: {
    id: string;
    slug: string;
    title: string;
    status: string;
    publishedAt: string | null;
    author: string;
  }[];
  recentComments: {
    id: string;
    body: string;
    createdAt: string;
    author: string;
    articleSlug: string | null;
  }[];
  recentUsers: {
    id: string;
    displayName: string;
    email: string;
    roles: string[];
    createdAt: string;
  }[];
}

const PIPELINE: ArticleStatus[] = [
  ArticleStatus.draft,
  ArticleStatus.assigned,
  ArticleStatus.in_progress,
  ArticleStatus.copy_edit,
  ArticleStatus.fact_check,
  ArticleStatus.legal,
  ArticleStatus.ready,
  ArticleStatus.correction_pending,
];

/** System-wide activity snapshot for the admin dashboard. */
@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<AdminOverview> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      active,
      suspended,
      newUsers,
      articleTotal,
      published,
      inPipeline,
      commentsVisible,
      commentsFlagged,
      recentArticles,
      recentComments,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.active } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.suspended } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
      this.prisma.article.count({ where: { deletedAt: null } }),
      this.prisma.article.count({
        where: { deletedAt: null, status: ArticleStatus.published },
      }),
      this.prisma.article.count({ where: { deletedAt: null, status: { in: PIPELINE } } }),
      this.prisma.comment.count({
        where: { deletedAt: null, status: CommentStatus.visible },
      }),
      this.prisma.comment.count({
        where: {
          deletedAt: null,
          OR: [{ reportCount: { gt: 0 } }, { status: CommentStatus.pending }],
        },
      }),
      this.prisma.article.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          publishedAt: true,
          author: { select: { displayName: true } },
        },
      }),
      this.prisma.comment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { displayName: true } },
          article: { select: { slug: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          displayName: true,
          email: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
      }),
    ]);

    return {
      users: { total: users, active, suspended, newLast7Days: newUsers },
      articles: { total: articleTotal, published, inPipeline },
      comments: { visible: commentsVisible, flagged: commentsFlagged },
      recentArticles: recentArticles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        status: a.status,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        author: a.author.displayName,
      })),
      recentComments: recentComments.map((c) => ({
        id: c.id,
        body: c.body.length > 140 ? `${c.body.slice(0, 140)}…` : c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.author.displayName,
        // null for comments on galleries/podcasts/interactives/videos
        articleSlug: c.article?.slug ?? null,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        roles: u.roles.map((m) => m.role.name),
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }
}
