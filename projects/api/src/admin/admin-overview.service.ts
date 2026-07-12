import { Injectable } from '@nestjs/common';
import { ArticleStatus, CommentStatus, MediaStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminOverview {
  users: { total: number; active: number; suspended: number; newLast7Days: number };
  articles: { total: number; published: number; inPipeline: number };
  comments: { visible: number; flagged: number };
  /** Articles published per day for the last 14 days — the publishing-trend chart. */
  publishTrend: { date: string; count: number }[];
  /** How the whole archive splits across the workflow — the pipeline breakdown. */
  articlesByStatus: { status: string; count: number }[];
  /** The busiest desks — top categories by published count. */
  topCategories: { name: string; count: number }[];
  /** Published multimedia across the four hubs. */
  media: { videos: number; galleries: number; episodes: number; interactives: number };
  /** Site-wide engagement totals. */
  engagement: { views: number; likes: number; comments: number; shares: number };
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
    // 14 day buckets, aligned to UTC midnight, oldest first.
    const trendStart = new Date();
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCDate(trendStart.getUTCDate() - 13);
    const publishedFilter = { status: MediaStatus.published, deletedAt: null } as const;

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
      statusGroups,
      categoryGroups,
      trendRows,
      videoCount,
      galleryCount,
      episodeCount,
      interactiveCount,
      likeCount,
      commentTotal,
      articleAgg,
      totalSiteViews,
      mediaShares,
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
      // Workflow breakdown across every status.
      this.prisma.article.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      // Busiest desks — top categories by published article count.
      this.prisma.article.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, status: ArticleStatus.published },
        _count: { _all: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 6,
      }),
      // Publishing trend: published articles in the last 14 days, bucketed in JS.
      this.prisma.article.findMany({
        where: {
          deletedAt: null,
          status: ArticleStatus.published,
          publishedAt: { gte: trendStart },
        },
        select: { publishedAt: true },
      }),
      this.prisma.video.count({ where: { isHidden: false } }),
      this.prisma.gallery.count({ where: publishedFilter }),
      this.prisma.podcastEpisode.count({ where: publishedFilter }),
      this.prisma.interactive.count({ where: publishedFilter }),
      this.prisma.contentLike.count(),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.article.aggregate({
        where: { deletedAt: null },
        _sum: { viewCount: true, shareCount: true },
      }),
      // Real site-wide views (every logged page view), not just article counters.
      this.prisma.pageView.count(),
      // Shares across the multimedia hubs, summed into the site-wide total.
      Promise.all([
        this.prisma.video.aggregate({ _sum: { shareCount: true } }),
        this.prisma.gallery.aggregate({ where: { deletedAt: null }, _sum: { shareCount: true } }),
        this.prisma.podcastEpisode.aggregate({
          where: { deletedAt: null },
          _sum: { shareCount: true },
        }),
        this.prisma.interactive.aggregate({
          where: { deletedAt: null },
          _sum: { shareCount: true },
        }),
      ]),
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

    // Resolve category names for the top desks.
    const categoryIds = categoryGroups
      .map((g) => g.categoryId)
      .filter((id): id is string => Boolean(id));
    const categories = categoryIds.length
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));

    // Bucket the publishing trend into 14 UTC days, oldest first.
    const trend = new Map<string, number>();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(trendStart);
      d.setUTCDate(d.getUTCDate() + i);
      trend.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of trendRows) {
      if (!row.publishedAt) continue;
      const key = row.publishedAt.toISOString().slice(0, 10);
      if (trend.has(key)) trend.set(key, (trend.get(key) ?? 0) + 1);
    }

    return {
      users: { total: users, active, suspended, newLast7Days: newUsers },
      articles: { total: articleTotal, published, inPipeline },
      comments: { visible: commentsVisible, flagged: commentsFlagged },
      publishTrend: [...trend.entries()].map(([date, count]) => ({ date, count })),
      articlesByStatus: statusGroups
        .map((g) => ({ status: g.status, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      topCategories: categoryGroups.map((g) => ({
        name: (g.categoryId && categoryName.get(g.categoryId)) || 'Uncategorised',
        count: g._count._all,
      })),
      media: {
        videos: videoCount,
        galleries: galleryCount,
        episodes: episodeCount,
        interactives: interactiveCount,
      },
      engagement: {
        views: totalSiteViews,
        likes: likeCount,
        comments: commentTotal,
        shares:
          (articleAgg._sum.shareCount ?? 0) +
          mediaShares.reduce((sum, m) => sum + (m._sum.shareCount ?? 0), 0),
      },
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
